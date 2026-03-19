"""
Unit tests for Docker DNS configuration validation.

CRITICAL: Do NOT add --dns 8.8.8.8 or --dns 8.8.4.4 to docker run commands.

When containers use Google public DNS (8.8.8.8) instead of the host's default resolver:
- metadata.google.internal does NOT resolve (GCE-internal hostname, not in public DNS)
- Result: Secret Manager, gRPC auth, ADC all fail with "Name or service not known"
- Services (instruments-service, market-tick-data-handler, etc.) cannot authenticate

If external API DNS (e.g. Aster) has transient failures, use application-level retry
(instruments-service AsterAdapter._request_with_retry) or --add-host metadata.google.internal:169.254.169.254
to keep both metadata and external DNS working.
"""

from pathlib import Path

# Patterns that would break metadata.google.internal resolution
FORBIDDEN_DNS_PATTERNS = [
    "--dns 8.8.8.8",
    "--dns 8.8.4.4",
    "--dns=8.8.8.8",
    "--dns=8.8.4.4",
]


def test_vm_backend_cloud_init_template_no_public_dns():
    """
    CLOUD_INIT_TEMPLATE (COS) must NOT use --dns 8.8.8.8.
    Public DNS breaks metadata.google.internal resolution.
    """
    from deployment_service.backends.services.vm_config import CLOUD_INIT_TEMPLATE

    for pattern in FORBIDDEN_DNS_PATTERNS:
        assert pattern not in CLOUD_INIT_TEMPLATE, (
            f"CLOUD_INIT_TEMPLATE must NOT contain '{pattern}'. "
            "Public DNS breaks metadata.google.internal. "
            "See test_docker_dns_validation.py docstring."
        )


def test_vm_backend_cloud_init_gcsfuse_template_no_public_dns():
    """
    CLOUD_INIT_GCSFUSE_TEMPLATE (Ubuntu) must NOT use --dns 8.8.8.8.
    Public DNS breaks metadata.google.internal resolution.
    """
    from deployment_service.backends.services.vm_config import CLOUD_INIT_GCSFUSE_TEMPLATE

    for pattern in FORBIDDEN_DNS_PATTERNS:
        assert pattern not in CLOUD_INIT_GCSFUSE_TEMPLATE, (
            f"CLOUD_INIT_GCSFUSE_TEMPLATE must NOT contain '{pattern}'. "
            "Public DNS breaks metadata.google.internal. "
            "See test_docker_dns_validation.py docstring."
        )


def test_terraform_cloud_init_no_public_dns():
    """
    Terraform compute-vm cloud-init must NOT use --dns 8.8.8.8.
    Public DNS breaks metadata.google.internal resolution.
    """
    terraform_path = (
        Path(__file__).parent.parent.parent
        / "terraform"
        / "modules"
        / "compute-vm"
        / "gcp"
        / "cloud-init.yaml.tpl"
    )
    content = terraform_path.read_text()

    for pattern in FORBIDDEN_DNS_PATTERNS:
        assert pattern not in content, (
            f"Terraform cloud-init must NOT contain '{pattern}'. "
            "Public DNS breaks metadata.google.internal. "
            "See test_docker_dns_validation.py docstring."
        )


def test_aws_ec2_backend_no_public_dns():
    """
    AWS EC2 startup script must NOT use --dns 8.8.8.8.
    Aligned with GCP behavior; AWS metadata uses different resolution.
    """
    aws_path = (
        Path(__file__).parent.parent.parent / "deployment_service" / "backends" / "aws_ec2.py"
    )
    content = aws_path.read_text()

    for pattern in FORBIDDEN_DNS_PATTERNS:
        assert pattern not in content, (
            f"AWS EC2 backend must NOT contain '{pattern}'. "
            "Aligned with GCP policy. "
            "See test_docker_dns_validation.py docstring."
        )
