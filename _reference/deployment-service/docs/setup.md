# Setup Guide

Complete setup and installation guide for deployment-service-v2.

**Last consolidated:** 2026-02-09

---

## Quick Start (5 minutes)

### Prerequisites

- Python 3.13.x (required; pyproject.toml requires >=3.13,<3.14)
- Node.js 18+ (for the frontend UI)
- GCP project access (`test-project`)
- SSH key configured with GitHub (for `unified-trading-library` dependency)

### Installation

```bash
# 1. Install Python 3.13 system-wide
pyenv install 3.13.1 && pyenv local 3.13.1

# 2. Clone the repository
git clone git@github.com:IggyIkenna/deployment-service-v2.git
cd deployment-service-v2

# 3. Run setup (creates venv, installs all Python dependencies)
source ./scripts/setup.sh

# 4. Install frontend dependencies
cd ui && npm install && cd ..

# 5. Copy environment file
cp .env.example .env
```

### Credentials Setup

**Automatic**: Place your GCP credentials file (`test-project-e35fb0ddafe2.json`) in the current directory or parent (`unified-trading-system-repos/`). The setup script will auto-detect it.

**Manual**: `export GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json`

### Quick Test

```bash
deploy-shards list-services
deploy-shards calculate market-tick-data-handler --start-date 2023-05-23 --end-date 2023-05-23
./run-api.sh all
```

- **Backend API**: http://127.0.0.1:8000
- **Frontend UI**: http://localhost:5173

---

## Detailed Setup

### Directory Structure

```
unified-trading-system-repos/
├── deployment-service-v2/
│   ├── api/                         # FastAPI backend
│   ├── backends/                    # Cloud Run / VM deployment backends
│   ├── configs/                     # Sharding, checklists, data catalogues
│   ├── deployment/                  # Deployment orchestration logic
│   ├── docs/                        # Documentation
│   ├── scripts/                     # Setup and utility scripts
│   ├── terraform/                   # Infrastructure as code
│   ├── tests/                       # Unit, integration, e2e tests
│   ├── ui/                          # React/Vite frontend
│   └── deployment_service/  # Core Python package
├── unified-trading-library/          # Shared cloud abstractions
├── instruments-service/
└── ...
```

### Python API (Correct Usage)

```python
from deployment_service import ShardCalculator, ConfigLoader, CloudClient

# ShardCalculator takes config_dir (string), not ConfigLoader instance
calculator = ShardCalculator("configs")
shards = calculator.calculate_shards(
    service="market-tick-data-handler",
    start_date="2024-01-01",
    end_date="2024-01-07",
    max_shards=100
)
for shard in shards:
    print(shard.cli_command)
```

---

## GCP Authentication

```bash
gcloud auth login
gcloud config set project test-project
gcloud auth application-default login
```

### Verify Access

```bash
gcloud run jobs list --region=asia-northeast1
gsutil ls gs://deployment-orchestration-test-project/
gcloud compute instances list --limit=5
```

---

## Terraform Infrastructure

Terraform creates Cloud Run Jobs, Workflows, and Schedulers. Directory: `terraform/services/<service>/gcp/`

```bash
cd terraform/services/instruments-service/gcp
terraform init
terraform plan
terraform apply
```

---

## Environment Configuration

| Variable         | Value                                          |
| ---------------- | ---------------------------------------------- |
| `DEPLOYMENT_ENV` | `development` (local) or `production` (Docker) |
| `STATE_BUCKET`   | `deployment-orchestration-test-project`        |
| `GCP_PROJECT_ID` | `test-project`                                 |

**State paths:**

- Local: `deployments.development/`
- Production: `deployments.production/`

---

## Setup Validation (Multi-Service)

See [INDEX.md](INDEX.md) for validation workflow. Key: Python 3.13 for all services; run `./scripts/quality-gates.sh` before push.

---

## Troubleshooting

| Issue                                 | Fix                                                              |
| ------------------------------------- | ---------------------------------------------------------------- |
| Python 3.13 required                  | `pyenv install 3.13.1 && pyenv local 3.13.1`                     |
| Architecture mismatch (M1/M2)         | Use native ARM64 Python, not x86 under Rosetta                   |
| SSH failure (unified-trading-library) | Add SSH key at github.com/settings/keys                          |
| Port 8000/5173 in use                 | `run-api.sh` kills existing; or `lsof -ti:8000 \| xargs kill -9` |
| Permission denied GCP                 | `gcloud auth application-default login`                          |

---

## Related Documentation

- [CLI.md](CLI.md) - CLI reference
- [INFRASTRUCTURE.md](INFRASTRUCTURE.md) - GCP IAM, secrets
- [INDEX.md](INDEX.md) - Doc index
