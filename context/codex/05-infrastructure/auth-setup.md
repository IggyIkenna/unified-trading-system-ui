# Authentication Setup Guide

## TL;DR

Complete guide for authentication setup: personal access tokens, service accounts, GitHub CLI auth, GCP auth, and secret
management.

---

## Phase 1: GitHub Authentication

### 1.1 Personal Access Token (Classic)

**Create token:**

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Set expiration: 90 days (recommended) or No expiration (not recommended)
4. Select scopes:
   - `repo` (full control of private repositories)
   - `workflow` (update GitHub Actions workflows)
   - `read:org` (read org and team membership)
   - `write:packages` (upload packages to GitHub Package Registry)

**Store token securely:**

```bash
# Add to shell profile (NOT committed to git)
echo 'export GITHUB_TOKEN=ghp_your_token_here' >> ~/.zshrc
source ~/.zshrc

# Or use GitHub CLI to store
gh auth login
# Select: GitHub.com → HTTPS → Paste token
```

### 1.2 Fine-Grained Personal Access Token (Recommended)

**Create token:**

1. Go to GitHub Settings → Developer settings → Personal access tokens → Fine-grained tokens
2. Click "Generate new token"
3. Set resource owner: IggyIkenna
4. Set repository access: All repositories (or select specific repos)
5. Set permissions:
   - Repository permissions:
     - Contents: Read and write
     - Pull requests: Read and write
     - Workflows: Read and write
   - Organization permissions:
     - Members: Read

**Advantages over classic:**

- Scoped to specific repositories
- Shorter expiration (max 1 year)
- More granular permissions
- Can be revoked per-repo

### 1.3 GitHub CLI Authentication

```bash
# Install GitHub CLI
brew install gh  # macOS
# or
sudo apt install gh  # Linux

# Authenticate
gh auth login

# Select:
# - GitHub.com
# - HTTPS
# - Yes (authenticate Git with GitHub credentials)
# - Paste your token

# Verify
gh auth status

# Test
gh repo list IggyIkenna --limit 5
```

---

## Phase 2: GCP Authentication

### 2.1 Application Default Credentials (ADC)

**For local development:**

```bash
# Authenticate with your user account
gcloud auth application-default login

# Verify
gcloud auth application-default print-access-token

# Set default project
gcloud config set project test-project
```

**ADC search order:**

1. `GOOGLE_APPLICATION_CREDENTIALS` environment variable (service account key file)
2. User credentials from `gcloud auth application-default login`
3. Attached service account (Cloud Run, Compute Engine, Cloud Build)

### 2.2 Service Account Key File

**Create service account:**

```bash
# Create service account
gcloud iam service-accounts create batch-processing-sa \
  --display-name="Batch Processing Service Account" \
  --description="Service account for batch processing services"

# Grant roles
gcloud projects add-iam-policy-binding test-project \
  --member=serviceAccount:batch-processing-sa@test-project.iam.gserviceaccount.com \
  --role=roles/storage.objectAdmin

gcloud projects add-iam-policy-binding test-project \
  --member=serviceAccount:batch-processing-sa@test-project.iam.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor

# Create key file
gcloud iam service-accounts keys create ~/batch-processing-sa-key.json \
  --iam-account=batch-processing-sa@test-project.iam.gserviceaccount.com

# Set environment variable
export GOOGLE_APPLICATION_CREDENTIALS="$HOME/batch-processing-sa-key.json"
echo 'export GOOGLE_APPLICATION_CREDENTIALS="$HOME/batch-processing-sa-key.json"' >> ~/.zshrc
```

**Security best practices:**

- NEVER commit key files to git
- Store in secure location (e.g., `~/.gcp/`)
- Set restrictive permissions: `chmod 600 ~/batch-processing-sa-key.json`
- Rotate keys every 90 days
- Use Workload Identity Federation instead of key files when possible

### 2.3 Workload Identity Federation (Recommended for CI/CD)

**Setup for GitHub Actions:**

```bash
# Create workload identity pool
gcloud iam workload-identity-pools create github-actions \
  --location=global \
  --display-name="GitHub Actions Pool"

# Create workload identity provider
gcloud iam workload-identity-pools providers create-oidc github-actions-provider \
  --location=global \
  --workload-identity-pool=github-actions \
  --issuer-uri=https://token.actions.githubusercontent.com \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
  --attribute-condition="assertion.repository_owner=='IggyIkenna'"

# Grant service account access
gcloud iam service-accounts add-iam-policy-binding batch-processing-sa@test-project.iam.gserviceaccount.com \
  --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/<project-number>/locations/global/workloadIdentityPools/github-actions/attribute.repository/IggyIkenna/<repo-name>"
```

**Use in GitHub Actions:**

```yaml
# .github/workflows/quality-gates.yml
jobs:
  quality-gates:
    runs-on: ubuntu-latest

    permissions:
      contents: read
      id-token: write # Required for Workload Identity Federation

    steps:
      - uses: actions/checkout@v4

      - uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: "projects/<project-number>/locations/global/workloadIdentityPools/github-actions/providers/github-actions-provider"
          service_account: "batch-processing-sa@test-project.iam.gserviceaccount.com"

      - name: Use GCP
        run: gcloud storage ls
```

---

## Phase 3: Secret Management

### 3.1 GCP Secret Manager

**Create secrets:**

```bash
# Create secret from stdin
echo -n "your-api-key" | gcloud secrets create tardis-api-key \
  --data-file=- \
  --replication-policy=automatic

# Create secret from file
gcloud secrets create github-token \
  --data-file=github-token.txt \
  --replication-policy=automatic

# List secrets
gcloud secrets list

# View secret versions
gcloud secrets versions list tardis-api-key

# Access secret
gcloud secrets versions access latest --secret=tardis-api-key
```

**Using the PM script (any secret, e.g. betfair-api-key):**

```bash
# From workspace root
bash unified-trading-pm/scripts/setup_secret.sh -p $GCP_PROJECT_ID -n betfair-api-key -v "YOUR_BETFAIR_APP_KEY"
# Or pipe value
echo -n "key" | bash unified-trading-pm/scripts/setup_secret.sh -p $GCP_PROJECT_ID -n tardis-api-key
```

**Grant access to service account:**

```bash
gcloud secrets add-iam-policy-binding tardis-api-key \
  --member=serviceAccount:batch-processing-sa@test-project.iam.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor
```

**Use in code:**

```python
from unified_trading_services import get_secret_client

api_key = get_secret_client(
    project_id="test-project",
    secret_name="tardis-api-key",
)
```

### 3.2 GitHub Secrets

**Add secrets via CLI:**

```bash
# Add secret
gh secret set GCP_PROJECT_ID --body "test-project"
gh secret set GCP_PROJECT_ID_DEV --body "dev-project-id"

# Add from file
gh secret set GOOGLE_APPLICATION_CREDENTIALS < ~/batch-processing-sa-key.json

# List secrets
gh secret list

# Delete secret
gh secret delete SECRET_NAME
```

**Add secrets via web UI:**

1. Go to repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Enter name and value
4. Click "Add secret"

**Use in GitHub Actions:**

```yaml
steps:
  - name: Use secret
    run: echo "Project: ${{ secrets.GCP_PROJECT_ID }}"
    env:
      GCP_PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
```

**GH_PAT verification (workspace-wide):**

```bash
# Verify GH_PAT exists in all workspace repos
bash unified-trading-pm/scripts/repo-management/verify-gh-pat-secrets.sh

# Set GH_PAT for all repos (one-time setup)
bash unified-trading-pm/github-integration/scripts/one-time/set-gh-pat-all-repos.sh
```

See: `unified-trading-pm/scripts/repo-management/verify-gh-pat-secrets.sh`,
`unified-trading-pm/github-integration/docs/AUTHENTICATION-CONSOLIDATION.md`

### 3.3 Environment Variables (.env)

**For local development only:**

```bash
# Create .env file (NOT committed to git)
cat > .env << 'EOF'
GCP_PROJECT_ID=test-project
GCP_PROJECT_ID_DEV=dev-project-id
ENVIRONMENT=development

# API Keys (use Secret Manager in production)
TARDIS_API_KEY=your-key-here
DATABENTO_API_KEY=your-key-here
EOF

# Add to .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
```

**Load in code:**

```python
from unified_config_interface import UnifiedCloudConfig

# Automatically loads from .env if present
config = UnifiedCloudConfig()
```

---

## Phase 4: Docker Authentication

### 4.1 Artifact Registry Authentication

**Configure Docker:**

```bash
# Configure Docker to use gcloud as credential helper
gcloud auth configure-docker asia-northeast1-docker.pkg.dev

# Verify
docker pull asia-northeast1-docker.pkg.dev/test-project/unified-trading-services/unified-trading-services:latest
```

**For CI/CD:**

```yaml
# cloudbuild.yaml
steps:
  # No explicit auth needed - Cloud Build has automatic access
  - name: "gcr.io/cloud-builders/docker"
    args:
      - "pull"
      - "asia-northeast1-docker.pkg.dev/$PROJECT_ID/unified-trading-services/unified-trading-services:latest"
```

**For GitHub Actions:**

```yaml
# .github/workflows/docker-build.yml
steps:
  - uses: google-github-actions/auth@v2
    with:
      credentials_json: ${{ secrets.GCP_SA_KEY }}

  - name: Configure Docker
    run: gcloud auth configure-docker asia-northeast1-docker.pkg.dev

  - name: Pull image
    run: docker pull asia-northeast1-docker.pkg.dev/${{ secrets.GCP_PROJECT_ID
      }}/unified-trading-services/unified-trading-services:latest
```

### 4.2 Docker Hub Authentication (Optional)

```bash
# Login to Docker Hub
docker login

# Use in GitHub Actions
# Add DOCKERHUB_USERNAME and DOCKERHUB_TOKEN as secrets
- name: Login to Docker Hub
  uses: docker/login-action@v3
  with:
    username: ${{ secrets.DOCKERHUB_USERNAME }}
    password: ${{ secrets.DOCKERHUB_TOKEN }}
```

---

## Phase 5: SSH Keys

### 5.1 Generate SSH Key

```bash
# Generate new SSH key
ssh-keygen -t ed25519 -C "your-email@example.com" -f ~/.ssh/id_ed25519_github

# Start ssh-agent
eval "$(ssh-agent -s)"

# Add key to ssh-agent
ssh-add ~/.ssh/id_ed25519_github

# Copy public key
cat ~/.ssh/id_ed25519_github.pub
```

### 5.2 Add to GitHub

1. Go to GitHub Settings → SSH and GPG keys
2. Click "New SSH key"
3. Paste public key
4. Click "Add SSH key"

**Test connection:**

```bash
ssh -T git@github.com
# Should see: Hi username! You've successfully authenticated...
```

### 5.3 Configure Git to Use SSH

```bash
# Set remote to use SSH
git remote set-url origin git@github.com:IggyIkenna/<repo-name>.git

# Or clone with SSH
git clone git@github.com:IggyIkenna/<repo-name>.git
```

---

## Phase 6: API Keys

### 6.1 Tardis API Key

**Obtain key:**

1. Go to https://tardis.dev/
2. Sign up / log in
3. Navigate to API Keys
4. Generate new key

**Store securely:**

```bash
# Local development (.env)
echo "TARDIS_API_KEY=your-key" >> .env

# Production (Secret Manager)
echo -n "your-key" | gcloud secrets create tardis-api-key --data-file=-

# GitHub Actions
gh secret set TARDIS_API_KEY --body "your-key"
```

### 6.2 Databento API Key

**Obtain key:**

1. Go to https://databento.com/
2. Sign up / log in
3. Navigate to API Keys
4. Generate new key

**Store securely:**

```bash
# Local development (.env)
echo "DATABENTO_API_KEY=your-key" >> .env

# Production (Secret Manager)
echo -n "your-key" | gcloud secrets create databento-api-key --data-file=-

# GitHub Actions
gh secret set DATABENTO_API_KEY --body "your-key"
```

### 6.3 The Graph API Key

**Obtain key:**

1. Go to https://thegraph.com/
2. Sign up / log in
3. Navigate to API Keys
4. Generate new key

**Store securely:**

```bash
# Local development (.env)
echo "GRAPH_API_KEY=your-key" >> .env

# Production (Secret Manager)
echo -n "your-key" | gcloud secrets create graph-api-key --data-file=-
```

---

## Phase 7: Verification

### 7.1 GitHub Authentication

```bash
# Verify GitHub CLI
gh auth status

# Verify token works
gh repo list IggyIkenna --limit 5

# Verify SSH
ssh -T git@github.com
```

### 7.2 GCP Authentication

```bash
# Verify ADC
gcloud auth application-default print-access-token

# Verify service account
gcloud auth list

# Verify access to GCS
gcloud storage ls

# Verify access to Secret Manager
gcloud secrets list
```

### 7.3 Docker Authentication

```bash
# Verify Artifact Registry access
docker pull asia-northeast1-docker.pkg.dev/test-project/unified-trading-services/unified-trading-services:latest

# Verify push access
docker tag local-image:latest asia-northeast1-docker.pkg.dev/test-project/test-repo/test-image:latest
docker push asia-northeast1-docker.pkg.dev/test-project/test-repo/test-image:latest
```

---

## Security Best Practices

### DO:

- Use Workload Identity Federation for CI/CD (no key files)
- Rotate service account keys every 90 days
- Use fine-grained GitHub tokens (not classic)
- Store secrets in Secret Manager (not .env in production)
- Use `chmod 600` for credential files
- Add credential files to .gitignore
- Use separate dev/prod projects

### NEVER:

- Commit credentials to git
- Share service account keys
- Use long-lived tokens without rotation
- Store secrets in code or config files
- Use root/admin accounts for services
- Grant more permissions than needed

---

## Troubleshooting

### Issue: "Permission denied" when accessing GCS

**Solution:**

```bash
# Check current auth
gcloud auth list

# Re-authenticate
gcloud auth application-default login

# Verify service account has correct roles
gcloud projects get-iam-policy test-project \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:batch-processing-sa@test-project.iam.gserviceaccount.com"
```

### Issue: "Invalid credentials" in GitHub Actions

**Solution:**

```bash
# Verify secret is set
gh secret list

# Re-add secret
gh secret set GCP_SA_KEY < ~/batch-processing-sa-key.json

# Check workflow has correct permissions
# Add to workflow:
permissions:
  contents: read
  id-token: write
```

### Issue: Docker pull fails with "unauthorized"

**Solution:**

```bash
# Re-configure Docker auth
gcloud auth configure-docker asia-northeast1-docker.pkg.dev

# Verify service account has artifactregistry.reader role
gcloud artifacts repositories add-iam-policy-binding <repo-name> \
  --location=asia-northeast1 \
  --member=serviceAccount:batch-processing-sa@test-project.iam.gserviceaccount.com \
  --role=roles/artifactregistry.reader
```

---

## Phase 8: Google OAuth for Service APIs

### 8.1 Pattern — client_id from Secret Manager

All service APIs using Google OAuth (`GoogleOIDCAuth`, `GoogleOAuthMiddleware`) must load `client_id` from Secret
Manager at startup. Never hardcode the client ID or use a string literal as a fallback.

```python
import os
from unified_trading_services import get_secret_client
from execution_service.auth import GoogleOIDCAuth  # service-local, not from UTS

_GCP_PROJECT_ID: str = os.environ["GCP_PROJECT_ID"]  # fail loud

_GOOGLE_OAUTH_CLIENT_ID: str = get_secret_client(
    project_id=_GCP_PROJECT_ID,
    secret_name="google-oauth-client-id",
)

auth = GoogleOIDCAuth(
    client_id=_GOOGLE_OAUTH_CLIENT_ID,
    allowed_domains=["yourdomain.com"],
    admin_groups=["admins@yourdomain.com"],
)
```

### 8.2 Kill-switch API key

Execution-services exposes `/kill-switch/activate|deactivate` protected by an API key header. The key must come from
Secret Manager:

```python
KILL_SWITCH_API_KEY: str = get_secret_client(
    project_id=_GCP_PROJECT_ID,
    secret_name="execution-service-kill-switch-api-key",
)
```

Provision this secret before deploying execution-service:

```bash
openssl rand -hex 32 | gcloud secrets create execution-service-kill-switch-api-key \
  --data-file=- --replication-policy=automatic
```

### 8.3 Auth class location

`GoogleOIDCAuth` and `GoogleOAuthMiddleware` are **service-local** modules, not in `unified_trading_services`:

| Class                   | Module                      | Service              |
| ----------------------- | --------------------------- | -------------------- |
| `GoogleOIDCAuth`        | `execution_service.auth`    | execution-service    |
| `GoogleOAuthMiddleware` | `client_reporting_api.auth` | client-reporting-api |

`unified_trading_services.auth` was deleted Feb 2026. Any import from it will fail at runtime.

---

## Related Documents

| Document                                                 | Description                     |
| -------------------------------------------------------- | ------------------------------- |
| [cicd-setup.md](cicd-setup.md)                           | CI/CD pipeline configuration    |
| [service-setup-checklist.md](service-setup-checklist.md) | Complete service setup          |
| [artifact-registry-setup.md](artifact-registry-setup.md) | Artifact Registry configuration |
