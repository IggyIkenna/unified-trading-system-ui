#!/usr/bin/env bash
#
# setup-oauth.sh — Set up Google OAuth 2.0 client for Unified Trading System
#
# Creates an OAuth 2.0 client in Google Cloud Console and stores credentials
# in Secret Manager. Requires manual steps for consent screen configuration.
#
# Usage:
#   ./setup-oauth.sh [project_id] [authorized_domain]
#
# Example:
#   ./setup-oauth.sh my-gcp-project yourcompany.com
#

set -euo pipefail

# Parse arguments
PROJECT_ID="${1:-$(gcloud config get-value project)}"
AUTHORIZED_DOMAIN="${2:-example.com}"
APP_NAME="${OAUTH_APP_NAME:-Unified Trading System}"
SUPPORT_EMAIL="${OAUTH_SUPPORT_EMAIL:-support@$AUTHORIZED_DOMAIN}"

echo "=============================================="
echo "Unified Trading System — OAuth Setup"
echo "=============================================="
echo "Project:           $PROJECT_ID"
echo "Authorized Domain: $AUTHORIZED_DOMAIN"
echo "App Name:          $APP_NAME"
echo "Support Email:     $SUPPORT_EMAIL"
echo "=============================================="
echo

# Set the project
gcloud config set project "$PROJECT_ID"

# Enable required APIs
echo "[1/6] Enabling required APIs..."
gcloud services enable iap.googleapis.com --project="$PROJECT_ID"
gcloud services enable cloudidentity.googleapis.com --project="$PROJECT_ID"
gcloud services enable secretmanager.googleapis.com --project="$PROJECT_ID"
echo "✅ APIs enabled"

# Check if OAuth consent screen is configured
echo
echo "[2/6] Checking OAuth consent screen configuration..."
echo
echo "⚠️  MANUAL STEP REQUIRED:"
echo "The OAuth consent screen must be configured manually in the Google Cloud Console."
echo
echo "Please follow these steps:"
echo "1. Go to: https://console.cloud.google.com/apis/credentials/consent?project=$PROJECT_ID"
echo "2. Click 'CONFIGURE CONSENT SCREEN'"
echo "3. Select 'Internal' for user type (for corporate SSO)"
echo "4. Fill in the required fields:"
echo "   - App name: $APP_NAME"
echo "   - User support email: $SUPPORT_EMAIL"
echo "   - Authorized domains: $AUTHORIZED_DOMAIN"
echo "   - Developer contact: $SUPPORT_EMAIL"
echo "5. Add scopes:"
echo "   - openid"
echo "   - email"
echo "   - profile"
echo "6. Add test users if needed (for development)"
echo "7. Save and continue through all steps"
echo
read -p "Press Enter when you have completed the consent screen configuration..."

# Create OAuth 2.0 Client ID
echo
echo "[3/6] Creating OAuth 2.0 Client ID..."
echo
echo "⚠️  MANUAL STEP REQUIRED:"
echo "OAuth clients must be created manually in the Google Cloud Console."
echo
echo "Please follow these steps:"
echo "1. Go to: https://console.cloud.google.com/apis/credentials?project=$PROJECT_ID"
echo "2. Click '+ CREATE CREDENTIALS' → 'OAuth client ID'"
echo "3. Application type: 'Web application'"
echo "4. Name: 'unified-trading-system-web'"
echo "5. Authorized JavaScript origins (add all that apply):"
echo "   - http://localhost:8000"
echo "   - http://localhost:3000"
echo "   - http://localhost:5173"
echo "   - https://YOUR-CLOUD-RUN-URL.run.app"
echo "6. Authorized redirect URIs (add all that apply):"
echo "   - http://localhost:8000/auth/callback"
echo "   - http://localhost:3000/auth/callback"
echo "   - http://localhost:5173/auth/callback"
echo "   - https://YOUR-CLOUD-RUN-URL.run.app/auth/callback"
echo "7. Click 'CREATE'"
echo "8. Download the JSON credentials file"
echo
echo "After creating the OAuth client, you will see:"
echo "  - Client ID: xxxx.apps.googleusercontent.com"
echo "  - Client Secret: xxxx"
echo
read -p "Enter the Client ID: " CLIENT_ID
read -p "Enter the Client Secret: " CLIENT_SECRET

# Validate inputs
if [ -z "$CLIENT_ID" ] || [ -z "$CLIENT_SECRET" ]; then
    echo "❌ Error: Client ID and Client Secret are required"
    exit 1
fi

# Store in Secret Manager
echo
echo "[4/6] Storing OAuth credentials in Secret Manager..."

# Function to create or update a secret
create_or_update_secret() {
    local secret_name="$1"
    local secret_value="$2"

    # Check if secret exists
    if gcloud secrets describe "$secret_name" --project="$PROJECT_ID" &>/dev/null; then
        echo "  Updating secret: $secret_name"
        echo -n "$secret_value" | gcloud secrets versions add "$secret_name" \
            --project="$PROJECT_ID" \
            --data-file=-
    else
        echo "  Creating secret: $secret_name"
        echo -n "$secret_value" | gcloud secrets create "$secret_name" \
            --project="$PROJECT_ID" \
            --replication-policy="automatic" \
            --data-file=-
    fi
}

# Store OAuth credentials
create_or_update_secret "google-oauth-client-id" "$CLIENT_ID"
create_or_update_secret "google-oauth-client-secret" "$CLIENT_SECRET"
create_or_update_secret "oauth-authorized-domain" "$AUTHORIZED_DOMAIN"

# Create OAuth config JSON
OAUTH_CONFIG=$(cat <<EOF
{
  "client_id": "$CLIENT_ID",
  "client_secret": "$CLIENT_SECRET",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "redirect_uris": [
    "http://localhost:8000/auth/callback",
    "http://localhost:3000/auth/callback",
    "http://localhost:5173/auth/callback"
  ],
  "javascript_origins": [
    "http://localhost:8000",
    "http://localhost:3000",
    "http://localhost:5173"
  ]
}
EOF
)

create_or_update_secret "google-oauth-config" "$OAUTH_CONFIG"

# Set up Google Workspace groups (optional)
echo
echo "[5/6] Setting up Google Workspace groups..."
echo
echo "⚠️  OPTIONAL: Configure Google Workspace groups for role-based access"
echo
echo "Recommended groups to create in Google Workspace Admin:"
echo "  - traders@$AUTHORIZED_DOMAIN — Trading permissions"
echo "  - risk-managers@$AUTHORIZED_DOMAIN — Risk management permissions"
echo "  - analysts@$AUTHORIZED_DOMAIN — Read-only access"
echo "  - devops@$AUTHORIZED_DOMAIN — Deployment permissions"
echo "  - admins@$AUTHORIZED_DOMAIN — Full admin access"
echo
echo "These groups will be mapped to permissions in the application."
echo

# Grant service accounts access
echo "[6/6] Granting service account access to secrets..."

# Get list of service accounts
SA_LIST=$(gcloud iam service-accounts list --project="$PROJECT_ID" --format="value(email)" 2>/dev/null || true)

if [ -n "$SA_LIST" ]; then
    for secret in "google-oauth-client-id" "google-oauth-client-secret" "google-oauth-config" "oauth-authorized-domain"; do
        echo "  Granting access to secret: $secret"
        for sa_email in $SA_LIST; do
            gcloud secrets add-iam-policy-binding "$secret" \
                --member="serviceAccount:$sa_email" \
                --role="roles/secretmanager.secretAccessor" \
                --project="$PROJECT_ID" 2>/dev/null || true
        done
    done
    echo "✅ Service accounts granted access"
else
    echo "⚠️  No service accounts found. Grant access manually when needed."
fi

echo
echo "=============================================="
echo "✅ OAuth Setup Complete!"
echo "=============================================="
echo
echo "OAuth Configuration:"
echo "  Client ID: $CLIENT_ID"
echo "  Authorized Domain: $AUTHORIZED_DOMAIN"
echo
echo "Secrets Created:"
echo "  - google-oauth-client-id"
echo "  - google-oauth-client-secret"
echo "  - google-oauth-config (full config JSON)"
echo "  - oauth-authorized-domain"
echo
echo "To use in your application:"
echo "  from unified_trading_library.core.secret_manager import get_secrets_with_fallback"
echo "  secrets = get_secrets_with_fallback({"
echo "      'google-oauth-client-id': 'GOOGLE_OAUTH_CLIENT_ID',"
echo "      'google-oauth-client-secret': 'GOOGLE_OAUTH_CLIENT_SECRET'"
echo "  }, project_id='$PROJECT_ID')"
echo
echo "Next Steps:"
echo "1. Update production URLs in OAuth client when deploying to Cloud Run"
echo "2. Configure Google Workspace groups for role-based access"
echo "3. Test authentication flow in your application"
echo
echo "Testing authentication:"
echo "  curl http://localhost:8000/auth/login"
echo "=============================================="
