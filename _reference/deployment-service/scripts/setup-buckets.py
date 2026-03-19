#!/usr/bin/env python3
"""
Setup Storage Buckets for Unified Trading System

This script creates all required storage buckets (GCS or S3) for the Unified Trading
System. It reads bucket requirements from dependencies.yaml and cloud-providers.yaml.

Features:
- Idempotent: skips existing buckets
- Correct settings: versioning, lifecycle rules, labels/tags
- Multi-cloud: supports both GCP (GCS) and AWS (S3)
- Reads from configuration files for bucket naming
- Creates test buckets alongside production buckets (--include-test)

Test Bucket Naming Convention:
- Pattern: {service-category}-test-{project_id}
- Example: instruments-store-cefi-test-{project_id}
- Purpose: Isolated buckets for quality gates, smoke tests, and CI/CD
- Test buckets should never be used for production data
- Note: "test" is inserted BEFORE the project_id to match existing buckets

Prerequisites:
- GCP: gcloud auth login (or service account credentials)
- AWS: aws configure (or IAM role)

Usage:
    # GCP - create all production buckets
    python setup-buckets.py --cloud gcp

    # GCP - create all buckets including test buckets
    python setup-buckets.py --cloud gcp --include-test

    # GCP - create buckets for specific service (with test buckets)
    python setup-buckets.py --cloud gcp --service instruments-service --include-test

    # GCP - dry run (show what would be created)
    python setup-buckets.py --cloud gcp --include-test --dry-run

    # AWS - create all buckets including test buckets
    python setup-buckets.py --cloud aws --include-test

    # List all required buckets without creating
    python setup-buckets.py --cloud gcp --include-test --list-only

    # Create only test buckets (skip production)
    python setup-buckets.py --cloud gcp --test-only
"""

import argparse
import json
import logging
import os
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import yaml
from _common import get_aws_account_id, get_aws_region, get_gcs_region, get_project_id

logger = logging.getLogger(__name__)
# Global configuration holder
bucket_config = None


def get_config_dir() -> Path:
    """Get the configs directory path."""
    script_dir = Path(__file__).parent.parent
    return script_dir / "configs"


def load_yaml(path: Path) -> dict:
    """Load a YAML file."""
    with open(path) as f:
        return yaml.safe_load(f)


def load_bucket_config(config_dir: Path) -> dict:
    """Load bucket configuration from bucket_config.yaml."""
    global bucket_config
    if bucket_config is None:
        config_path = config_dir / "bucket_config.yaml"
        if not config_path.exists():
            raise FileNotFoundError(f"Bucket config not found: {config_path}")
        bucket_config = load_yaml(config_path)
    return bucket_config


def validate_config(config: dict) -> None:
    """Validate bucket configuration schema."""
    required_sections = [
        "defaults",
        "shared_bucket_services",
        "service_categories",
        "infrastructure_buckets",
        "aws_bucket_mappings",
        "bucket_settings",
    ]

    for section in required_sections:
        if section not in config:
            raise ValueError(f"Missing required config section: {section}")

    # Validate cloud providers in defaults
    if "gcp" not in config["defaults"] or "aws" not in config["defaults"]:
        raise ValueError("Missing gcp/aws sections in defaults")

    # Validate bucket settings for both clouds
    for cloud in ["gcp", "aws"]:
        if cloud not in config["bucket_settings"]:
            raise ValueError(f"Missing {cloud} bucket settings")


def get_default_values(cloud: str) -> dict:
    """Get default values for a cloud provider."""
    config = load_bucket_config(get_config_dir())
    defaults = config["defaults"][cloud]

    if cloud == "gcp":
        project_id = get_project_id()
        return {"project_id": project_id, "region": get_gcs_region(defaults["region"])}
    else:  # aws
        account_id = get_aws_account_id()
        if not account_id:
            try:
                result = subprocess.run(
                    ["aws", "sts", "get-caller-identity", "--query", "Account", "--output", "text"],
                    capture_output=True,
                    text=True,
                    timeout=30,
                )
                if result.returncode == 0:
                    account_id = result.stdout.strip()
            except (OSError, ValueError, RuntimeError) as e:
                logger.warning("Unexpected error during get default values: %s", e, exc_info=True)
                pass
        if not account_id:
            raise ValueError(
                "AWS_ACCOUNT_ID is required when using AWS. "
                "Set AWS_ACCOUNT_ID or ensure 'aws sts get-caller-identity' succeeds."
            )
        return {"account_id": account_id, "region": get_aws_region(defaults["region"])}


def get_test_bucket_name(prod_bucket_name: str, project_id: str) -> str:
    """
    Generate test bucket name from production bucket name using configuration.
    """
    config = load_bucket_config(get_config_dir())
    test_config = config["test_buckets"]

    if test_config["naming_pattern"] == "infix" and project_id in prod_bucket_name:
        # Insert '-test' before the project_id
        return prod_bucket_name.replace(f"-{project_id}", f"-test-{project_id}")
    else:
        # Fallback: append '-test' suffix
        return f"{prod_bucket_name}-test"


def get_all_required_buckets(
    config_dir: Path,
    cloud: str,
    project_id: str,
    env: str = "prod",
    service_filter: str | None = None,
    include_test: bool = False,
    test_only: bool = False,
) -> list[dict]:
    """
    Get all required buckets from dependencies.yaml and cloud-providers.yaml.

    Args:
        config_dir: Path to configs directory
        cloud: Cloud provider ('gcp' or 'aws')
        project_id: GCP project ID or AWS account ID
        service_filter: Optional service name to filter by
        include_test: If True, include test buckets alongside production
        test_only: If True, only return test buckets (skip production)

    Returns a list of bucket configurations with:
    - name: bucket name
    - service: which service needs it
    - type: 'output', 'input', 'infrastructure', or 'test'
    - category: which category it serves
    - is_test: True if this is a test bucket
    """
    deps = load_yaml(config_dir / "dependencies.yaml")
    cloud_config = load_yaml(config_dir / "cloud-providers.yaml")

    buckets = []
    seen_buckets = set()

    services = deps.get("services", {})

    for service_name, service_config in services.items():
        if service_filter and service_name != service_filter:
            continue

        # Get output buckets
        for output in service_config.get("outputs", []):
            bucket_template = output.get("bucket_template", "")
            if not bucket_template:
                continue

            # Determine categories for this service
            categories = get_service_categories(service_name)

            # Handle shared bucket services (no category)
            if not categories:
                # Shared bucket - resolve without category
                bucket_name = resolve_bucket_name(
                    bucket_template, "", project_id, cloud, cloud_config, env
                )

                if bucket_name and bucket_name not in seen_buckets:
                    # Add production bucket (unless test_only)
                    if not test_only:
                        seen_buckets.add(bucket_name)
                        buckets.append(
                            {
                                "name": bucket_name,
                                "service": service_name,
                                "type": "output",
                                "category": "ALL",  # Shared across all categories
                                "is_test": False,
                            }
                        )

                    # Add test bucket (if include_test or test_only)
                    if include_test or test_only:
                        test_bucket_name = get_test_bucket_name(bucket_name, project_id)
                        if test_bucket_name not in seen_buckets:
                            seen_buckets.add(test_bucket_name)
                            buckets.append(
                                {
                                    "name": test_bucket_name,
                                    "service": service_name,
                                    "type": "test",
                                    "category": "ALL",
                                    "is_test": True,
                                }
                            )
            else:
                # Category-specific buckets
                for category in categories:
                    bucket_name = resolve_bucket_name(
                        bucket_template, category, project_id, cloud, cloud_config, env
                    )

                    if bucket_name and bucket_name not in seen_buckets:
                        # Add production bucket (unless test_only)
                        if not test_only:
                            seen_buckets.add(bucket_name)
                            buckets.append(
                                {
                                    "name": bucket_name,
                                    "service": service_name,
                                    "type": "output",
                                    "category": category.upper(),
                                    "is_test": False,
                                }
                            )

                        # Add test bucket (if include_test or test_only)
                        if include_test or test_only:
                            test_bucket_name = get_test_bucket_name(bucket_name, project_id)
                            if test_bucket_name not in seen_buckets:
                                seen_buckets.add(test_bucket_name)
                                buckets.append(
                                    {
                                        "name": test_bucket_name,
                                        "service": service_name,
                                        "type": "test",
                                        "category": category.upper(),
                                        "is_test": True,
                                    }
                                )

        # Get input buckets from upstream dependencies
        for dep in service_config.get("upstream", []):
            # Support shorthand: upstream: [service-name] or full: [{service: ..., check: ...}]
            dep_dict = dep if isinstance(dep, dict) else {"service": dep, "check": {}}
            check = dep_dict.get("check", {})
            bucket_template = check.get("bucket_template", "")
            if not bucket_template:
                continue

            # Check for category restrictions
            dep_categories = check.get("categories")
            categories = dep_categories if dep_categories else get_service_categories(service_name)

            for category in categories:
                bucket_name = resolve_bucket_name(
                    bucket_template, category, project_id, cloud, cloud_config, env
                )

                if bucket_name and bucket_name not in seen_buckets:
                    # Add production bucket (unless test_only)
                    if not test_only:
                        seen_buckets.add(bucket_name)
                        buckets.append(
                            {
                                "name": bucket_name,
                                "service": dep_dict.get("service", "unknown"),
                                "type": "input",
                                "category": category.upper(),
                                "is_test": False,
                            }
                        )

                    # Add test bucket (if include_test or test_only)
                    if include_test or test_only:
                        test_bucket_name = get_test_bucket_name(bucket_name, project_id)
                        if test_bucket_name not in seen_buckets:
                            seen_buckets.add(test_bucket_name)
                            buckets.append(
                                {
                                    "name": test_bucket_name,
                                    "service": dep_dict.get("service", "unknown"),
                                    "type": "test",
                                    "category": category.upper(),
                                    "is_test": True,
                                }
                            )

    # Add infrastructure buckets (no test versions for infrastructure)
    if not test_only:
        infra_buckets = get_infrastructure_buckets(project_id, cloud, cloud_config)
        for bucket in infra_buckets:
            bucket["is_test"] = False
            if bucket["name"] not in seen_buckets:
                seen_buckets.add(bucket["name"])
                buckets.append(bucket)

    return sorted(buckets, key=lambda x: (x.get("is_test", False), x["name"]))


def get_service_categories(service_name: str) -> list[str]:
    """
    Get categories supported by a service.

    Returns:
        - Empty list [] for shared bucket services (no category dimension)
        - ["cefi", "tradfi"] for volatility service (no DEFI options)
        - ["cefi", "tradfi", "defi"] for most services
    """
    config = load_bucket_config(get_config_dir())

    # Services with SHARED buckets (no category)
    if service_name in config["shared_bucket_services"]:
        return []  # No category dimension - uses shared bucket

    # Services with restricted categories
    restricted = config["service_categories"]["restricted_categories"]
    for pattern, categories in restricted.items():
        if pattern in service_name:
            return categories

    # Default categories for most services
    return config["service_categories"]["default_categories"]


def resolve_bucket_name(
    template: str, category: str, project_id: str, cloud: str, cloud_config: dict, env: str = "prod"
) -> str | None:
    """Resolve a bucket name from template."""
    cat_lower = category.lower()
    config = load_bucket_config(get_config_dir())

    # Skip invalid category combinations
    for rule in config["validation"]["invalid_combinations"]:
        if rule["template_contains"] in template and cat_lower == rule["invalid_category"]:
            return None

    if cloud == "gcp":
        name = template.replace("{category_lower}", cat_lower)
        name = name.replace("{project_id}", project_id)
        name = name.replace("{domain}", cat_lower)
        name = name.replace("{env}", env)
        return name
    else:  # aws
        # Convert GCP naming to AWS naming
        return convert_to_aws_bucket_name(template, cat_lower, project_id, cloud_config, env)


def convert_to_aws_bucket_name(
    gcp_template: str, category: str, account_id: str, cloud_config: dict, env: str = "prod"
) -> str:
    """Convert a GCP bucket template to AWS S3 bucket name."""
    config = load_bucket_config(get_config_dir())
    mappings = config["aws_bucket_mappings"]

    # Find matching pattern in mappings
    for pattern, template in mappings.items():
        if pattern in gcp_template:
            return (
                template.replace("{category}", category)
                .replace("{account_id}", account_id)
                .replace("{env}", env)
            )

    # Fallback: replace default project with account_id
    defaults = config["defaults"]["gcp"]
    return gcp_template.replace(defaults["project_id"], account_id).replace("{env}", env)


def get_infrastructure_buckets(project_id: str, cloud: str, cloud_config: dict) -> list[dict]:
    """Get infrastructure buckets (terraform state, deployment orchestration)."""
    config = load_bucket_config(get_config_dir())
    infra_config = config["infrastructure_buckets"][cloud]

    buckets = []
    for bucket_def in infra_config:
        bucket_name = bucket_def["name_template"].replace("{project_id}", project_id)
        buckets.append(
            {
                "name": bucket_name,
                "service": bucket_def["service"],
                "type": bucket_def["type"],
                "category": bucket_def["category"],
            }
        )

    return buckets


def bucket_exists_gcs(bucket_name: str) -> bool:
    """Check if a GCS bucket exists via UCI get_storage_client."""
    try:
        from unified_cloud_interface import get_storage_client

        client = get_storage_client(provider="gcp")
        list(client.list_blobs(bucket=bucket_name, prefix="", max_results=1))
        return True
    except (OSError, ValueError, RuntimeError):
        return False


def bucket_exists_s3(bucket_name: str) -> bool:
    """Check if an S3 bucket exists via UCI get_storage_client."""
    try:
        from unified_cloud_interface import get_storage_client

        client = get_storage_client(provider="aws")
        list(client.list_blobs(bucket=bucket_name, prefix="", max_results=1))
        return True
    except (OSError, ValueError, RuntimeError):
        return False


def create_gcs_bucket(
    bucket_name: str,
    project_id: str,
    region: str,
    service: str,
    category: str,
    dry_run: bool = False,
    is_test: bool = False,
) -> bool:
    """
    Create a GCS bucket with settings from configuration.
    """
    config = load_bucket_config(get_config_dir())
    settings = config["bucket_settings"]["gcp"]

    if bucket_exists_gcs(bucket_name):
        logger.info(f"  [EXISTS] gs://{bucket_name}")
        return True

    bucket_type = "TEST" if is_test else "PROD"
    if dry_run:
        logger.info(f"  [DRY-RUN] Would create gs://{bucket_name} ({bucket_type})")
        return True

    logger.info(f"  [CREATE] gs://{bucket_name} ({bucket_type})")

    try:
        # Create bucket with configured settings
        create_args = [
            "gsutil",
            "mb",
            "-p",
            project_id,
            "-c",
            settings["storage_class"],
            "-l",
            region,
        ]
        if settings["uniform_bucket_access"]:
            create_args.extend(["-b", "on"])
        create_args.append(f"gs://{bucket_name}")

        result = subprocess.run(create_args, capture_output=True, text=True, timeout=60)
        if result.returncode != 0:
            logger.info(f"    ERROR: {result.stderr}")
            return False

        # Enable versioning if configured
        if settings["versioning"]:
            subprocess.run(
                ["gsutil", "versioning", "set", "on", f"gs://{bucket_name}"],
                capture_output=True,
                timeout=30,
            )

        # Set lifecycle rule from configuration
        lifecycle_type = "test" if is_test else "production"
        lifecycle_rule = settings["lifecycle_rules"][lifecycle_type]
        lifecycle_days = lifecycle_rule["age_days"]

        lifecycle_config = {
            "rule": [
                {
                    "action": {
                        "type": lifecycle_rule["action"],
                        "storageClass": lifecycle_rule["storage_class"],
                    },
                    "condition": {"age": lifecycle_days},
                }
            ]
        }

        lifecycle_file = f"/tmp/lifecycle_{bucket_name}.json"
        with open(lifecycle_file, "w") as f:
            json.dump(lifecycle_config, f)

        subprocess.run(
            ["gsutil", "lifecycle", "set", lifecycle_file, f"gs://{bucket_name}"],
            capture_output=True,
            timeout=30,
        )
        os.remove(lifecycle_file)

        # Set labels from configuration
        labels_config = settings["labels"]
        labels = f"managed-by:{labels_config['managed_by']}"
        labels += f",service:{service.replace('-', '_')}"
        if category != "ALL":
            labels += f",category:{category.lower()}"
        labels += f",environment:{'test' if is_test else 'production'}"

        subprocess.run(
            ["gsutil", "label", "ch", "-l", labels, f"gs://{bucket_name}"],
            capture_output=True,
            timeout=30,
        )

        logger.info(
            f"    OK (versioning=on, lifecycle={lifecycle_days}d->{lifecycle_rule['storage_class']})"
        )
        return True

    except subprocess.TimeoutExpired:
        logger.info("    ERROR: Timeout creating bucket")
        return False
    except (OSError, ValueError, RuntimeError) as e:
        logger.info(f"    ERROR: {e}")
        return False


def create_s3_bucket(
    bucket_name: str,
    region: str,
    service: str,
    category: str,
    dry_run: bool = False,
    is_test: bool = False,
) -> bool:
    """
    Create an S3 bucket with settings from configuration.
    """
    config = load_bucket_config(get_config_dir())
    settings = config["bucket_settings"]["aws"]

    if bucket_exists_s3(bucket_name):
        logger.info(f"  [EXISTS] s3://{bucket_name}")
        return True

    bucket_type = "TEST" if is_test else "PROD"
    if dry_run:
        logger.info(f"  [DRY-RUN] Would create s3://{bucket_name} ({bucket_type})")
        return True

    logger.info(f"  [CREATE] s3://{bucket_name} ({bucket_type})")

    try:
        # Create bucket
        create_cmd = ["aws", "s3api", "create-bucket", "--bucket", bucket_name, "--region", region]

        # For regions other than us-east-1, need LocationConstraint
        if region != "us-east-1":
            create_cmd.extend(["--create-bucket-configuration", f"LocationConstraint={region}"])

        result = subprocess.run(create_cmd, capture_output=True, text=True, timeout=60)
        if result.returncode != 0:
            logger.info(f"    ERROR: {result.stderr}")
            return False

        # Enable versioning if configured
        if settings["versioning"]:
            subprocess.run(
                [
                    "aws",
                    "s3api",
                    "put-bucket-versioning",
                    "--bucket",
                    bucket_name,
                    "--versioning-configuration",
                    "Status=Enabled",
                ],
                capture_output=True,
                timeout=30,
            )

        # Enable encryption from configuration
        encryption_config = {
            "Rules": [
                {
                    "ApplyServerSideEncryptionByDefault": {
                        "SSEAlgorithm": settings["encryption"]["algorithm"]
                    }
                }
            ]
        }
        subprocess.run(
            [
                "aws",
                "s3api",
                "put-bucket-encryption",
                "--bucket",
                bucket_name,
                "--server-side-encryption-configuration",
                json.dumps(encryption_config),
            ],
            capture_output=True,
            timeout=30,
        )

        # Set tags from configuration
        tags_config = settings["tags"]
        tags = [
            {"Key": "ManagedBy", "Value": tags_config["ManagedBy"]},
            {"Key": "Project", "Value": tags_config["Project"]},
            {"Key": "Service", "Value": service},
            {"Key": "Environment", "Value": "test" if is_test else "production"},
        ]
        if category != "ALL":
            tags.append({"Key": "Category", "Value": category})

        subprocess.run(
            [
                "aws",
                "s3api",
                "put-bucket-tagging",
                "--bucket",
                bucket_name,
                "--tagging",
                json.dumps({"TagSet": tags}),
            ],
            capture_output=True,
            timeout=30,
        )

        encryption_alg = settings["encryption"]["algorithm"]
        logger.info(f"    OK (versioning=on, encryption={encryption_alg})")
        return True

    except subprocess.TimeoutExpired:
        logger.info("    ERROR: Timeout creating bucket")
        return False
    except (OSError, ValueError, RuntimeError) as e:
        logger.info(f"    ERROR: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(
        description="Setup storage buckets for Unified Trading System",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("--cloud", choices=["gcp", "aws"], required=True, help="Cloud provider")
    parser.add_argument(
        "--env",
        choices=["staging", "prod", "development"],
        default=None,
        help="Deployment environment for bucket naming (default: DEPLOYMENT_ENV env var or 'prod')",
    )
    parser.add_argument("--service", help="Only create buckets for specific service")
    parser.add_argument("--project-id", help="GCP project ID or AWS account ID")
    parser.add_argument("--region", help="Region for bucket creation")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be created without creating",
    )
    parser.add_argument(
        "--list-only",
        action="store_true",
        help="List all required buckets without creating",
    )
    parser.add_argument("--config-dir", type=Path, help="Path to configs directory")
    parser.add_argument(
        "--include-test",
        action="store_true",
        help="Include test buckets alongside production buckets (naming: {bucket}-test)",
    )
    parser.add_argument(
        "--test-only",
        action="store_true",
        help="Only create test buckets (skip production buckets)",
    )

    args = parser.parse_args()

    # Resolve env: CLI arg > DEPLOYMENT_ENV env var > default "prod"
    from deployment_service.deployment_config import DeploymentConfig

    env = args.env or DeploymentConfig().deployment_env

    # Validate mutually exclusive options
    if args.test_only and not args.include_test:
        # --test-only implies --include-test behavior
        pass

    # Get config directory
    config_dir = args.config_dir or get_config_dir()
    if not config_dir.exists():
        logger.info(f"ERROR: Config directory not found: {config_dir}")
        sys.exit(1)

    # Load and validate bucket configuration
    try:
        bucket_config = load_bucket_config(config_dir)
        validate_config(bucket_config)
    except (FileNotFoundError, ValueError) as e:
        logger.info(f"ERROR: Configuration error: {e}")
        sys.exit(1)

    # Get project/account ID and region from configuration or args
    if args.project_id:
        project_id = args.project_id
        if args.region:
            region = args.region
        else:
            defaults = get_default_values(args.cloud)
            region = defaults.get("region")
    else:
        defaults = get_default_values(args.cloud)
        project_id = defaults.get("project_id") or defaults.get("account_id")
        region = args.region or defaults.get("region")

        if not project_id:
            if args.cloud == "aws":
                logger.info("ERROR: AWS_ACCOUNT_ID not set and could not determine from AWS CLI")
                logger.info("Run: aws sts get-caller-identity")
            else:
                logger.info("ERROR: GCP_PROJECT_ID not set")
            sys.exit(1)

    # Get all required buckets
    buckets = get_all_required_buckets(
        config_dir,
        args.cloud,
        project_id,
        env=env,
        service_filter=args.service,
        include_test=args.include_test or args.test_only,
        test_only=args.test_only,
    )

    if not buckets:
        logger.info("No buckets to create.")
        sys.exit(0)

    # Count production vs test buckets
    prod_buckets = [b for b in buckets if not b.get("is_test", False)]
    test_buckets = [b for b in buckets if b.get("is_test", False)]

    # Print header
    logger.info("")
    logger.info("=" * 70)
    logger.info("Unified Trading System - Bucket Setup")
    logger.info("=" * 70)
    logger.info(f"Cloud Provider: {args.cloud.upper()}")
    logger.info(f"Project/Account: {project_id}")
    logger.info(f"Region: {region}")
    logger.info(f"Total Buckets: {len(buckets)}")
    if args.include_test or args.test_only:
        logger.info(f"  - Production: {len(prod_buckets)}")
        logger.info(f"  - Test: {len(test_buckets)}")
    if args.service:
        logger.info(f"Service Filter: {args.service}")
    if args.test_only:
        logger.info("Mode: TEST BUCKETS ONLY")
    elif args.include_test:
        logger.info("Mode: Production + Test Buckets")
    logger.info("=" * 70)
    logger.info("")

    # List only mode
    if args.list_only:
        if args.include_test or args.test_only:
            # Separate production and test buckets in output
            if prod_buckets and not args.test_only:
                logger.info("Production buckets:")
                logger.info("")
                for bucket in prod_buckets:
                    prefix = "gs://" if args.cloud == "gcp" else "s3://"
                    logger.info(f"  {prefix}{bucket['name']}")
                    logger.info(
                        f"      Service: {bucket['service']}, Type: {bucket['type']}, Category: {bucket['category']}"
                    )
                logger.info("")

            if test_buckets:
                logger.info("Test buckets (for quality gates and CI/CD):")
                logger.info("")
                for bucket in test_buckets:
                    prefix = "gs://" if args.cloud == "gcp" else "s3://"
                    logger.info(f"  {prefix}{bucket['name']}")
                    logger.info(
                        f"      Service: {bucket['service']}, Category: {bucket['category']}"
                    )
                logger.info("")
        else:
            logger.info("Required buckets:")
            logger.info("")
            for bucket in buckets:
                prefix = "gs://" if args.cloud == "gcp" else "s3://"
                logger.info(f"  {prefix}{bucket['name']}")
                logger.info(
                    f"      Service: {bucket['service']}, Type: {bucket['type']}, Category: {bucket['category']}"
                )
            logger.info("")

        # Print env var suggestions for services
        if args.include_test or args.test_only:
            logger.info("=" * 70)
            logger.info("Environment Variables for Test Buckets")
            logger.info("=" * 70)
            logger.info("Add these to your .env files or CI/CD configuration:")
            logger.info("")
            for bucket in test_buckets:
                # Generate env var name from bucket name
                service_name = bucket["service"].replace("-", "_").upper()
                category = bucket["category"]
                if category != "ALL":
                    env_var = f"{service_name.replace('_SERVICE', '')}_GCS_BUCKET_{category}_TEST"
                else:
                    env_var = f"{service_name.replace('_SERVICE', '')}_GCS_BUCKET_TEST"
                logger.info(f"  {env_var}={bucket['name']}")
            logger.info("")

        sys.exit(0)

    # Check prerequisites
    if args.cloud == "gcp":
        # Check gcloud/gsutil
        try:
            subprocess.run(["gsutil", "version"], capture_output=True, timeout=10)
        except (OSError, ValueError, RuntimeError):
            sys.exit(1)
    else:
        # Check aws cli
        try:
            subprocess.run(["aws", "--version"], capture_output=True, timeout=10)
        except (OSError, ValueError, RuntimeError):
            logger.info("ERROR: aws CLI not found. Install AWS CLI.")
            sys.exit(1)

    # Create buckets
    created = 0
    skipped = 0
    failed = 0

    for bucket in buckets:
        is_test = bucket.get("is_test", False)

        if args.cloud == "gcp":
            success = create_gcs_bucket(
                bucket["name"],
                project_id,
                region,
                bucket["service"],
                bucket["category"],
                args.dry_run,
                is_test=is_test,
            )
        else:
            success = create_s3_bucket(
                bucket["name"],
                region,
                bucket["service"],
                bucket["category"],
                args.dry_run,
                is_test=is_test,
            )

        if success:
            if (
                bucket_exists_gcs(bucket["name"])
                if args.cloud == "gcp"
                else bucket_exists_s3(bucket["name"])
            ):
                skipped += 1
            else:
                created += 1
        else:
            failed += 1

    # Print summary
    logger.info("")
    logger.info("=" * 70)
    logger.info("Summary")
    logger.info("=" * 70)
    if args.dry_run:
        logger.info(f"  Would create: {len(buckets)} buckets")
    else:
        logger.info(f"  Created: {created}")
        logger.info(f"  Already existed: {skipped}")
        logger.info(f"  Failed: {failed}")
    logger.info("")

    if failed > 0:
        logger.info("Some buckets failed to create. Check permissions and try again.")
        sys.exit(1)
    else:
        logger.info("All buckets ready!")


if __name__ == "__main__":
    main()
