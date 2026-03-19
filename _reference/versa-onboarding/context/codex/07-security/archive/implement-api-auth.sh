#!/usr/bin/env bash
#
# Script to add Google OIDC authentication to all FastAPI services
# Uses the unified-trading-library auth module
#

set -e

echo "=================================================="
echo "API Authentication Implementation Script"
echo "=================================================="
echo ""
echo "This script adds Google OIDC authentication to FastAPI services"
echo ""

# Services that need authentication
SERVICES=(
    "execution-services"
    "position-balance-monitor-service"
    "risk-and-exposure-service"
    "strategy-service"
    "instruments-service"
)

# Template for adding auth to a FastAPI app
add_auth_to_service() {
    local service=$1
    local main_file=$2

    echo "Processing $service..."

    # Check if file exists
    if [ ! -f "$main_file" ]; then
        echo "  ⏭️  File not found: $main_file"
        return
    fi

    # Check if auth already implemented
    if grep -q "GoogleOIDCAuth" "$main_file" 2>/dev/null; then
        echo "  ✅ Auth already implemented"
        return
    fi

    # Create backup
    cp "$main_file" "$main_file.backup"

    # Add auth import and initialization at the top of the file
    # This is a simplified example - in practice you'd need more sophisticated editing
    echo "  📝 Adding auth to $main_file"

    # Create a Python script to add auth
    cat > /tmp/add_auth.py << 'EOF'
import sys

file_path = sys.argv[1]

auth_code = '''from unified_trading_library.auth import GoogleOIDCAuth
import os

# Initialize authentication (OAUTH_AUTHORIZED_DOMAIN from env, e.g. yourcompany.com)
_domain = os.environ.get("OAUTH_AUTHORIZED_DOMAIN", "company.com")
auth = GoogleOIDCAuth(
    allowed_domains=[_domain],
    admin_groups=[f"admins@{_domain}", f"devops@{_domain}"],
    group_permissions={
        f"traders@{_domain}": {"read", "write", "trade"},
        f"developers@{_domain}": {"read", "write", "debug"},
        f"analysts@{_domain}": {"read"},
        f"admins@{_domain}": {"admin", "read", "write", "trade"},
    },
    require_groups=True,
)

'''

with open(file_path, 'r') as f:
    content = f.read()

# Add auth import after FastAPI import
if "from fastapi import FastAPI" in content and "GoogleOIDCAuth" not in content:
    lines = content.split('\n')
    new_lines = []
    added = False

    for line in lines:
        new_lines.append(line)
        if "from fastapi import FastAPI" in line and not added:
            new_lines.append("")
            new_lines.extend(auth_code.split('\n')[:-1])
            added = True

    with open(file_path, 'w') as f:
        f.write('\n'.join(new_lines))
    print(f"✅ Added auth to {file_path}")
else:
    print(f"⏭️  Skipped {file_path} (already has auth or no FastAPI import)")
EOF

    python3 /tmp/add_auth.py "$main_file"
    rm /tmp/add_auth.py
}

# Process each service
for service in "${SERVICES[@]}"; do
    echo ""
    echo "🔍 Checking $service..."

    # Resolve workspace root from script location (unified-trading-codex/07-security/)
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    WORKSPACE_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
    service_dir="$WORKSPACE_ROOT/$service"

    if [ ! -d "$service_dir" ]; then
        echo "  ⏭️  Service directory not found"
        continue
    fi

    # Find main API files (exclude .venv, node_modules, __pycache__)
    api_files=$(find "$service_dir" -type f \( -name "main.py" -o -name "app.py" \) \
        -not -path "*/.venv/*" -not -path "*/node_modules/*" -not -path "*/__pycache__/*" \
        2>/dev/null | grep -E "api|app|/main\.py$|/app\.py$" || true)

    if [ -z "$api_files" ]; then
        echo "  ⏭️  No API files found"
        continue
    fi

    for api_file in $api_files; do
        add_auth_to_service "$service" "$api_file"
    done
done

echo ""
echo "=================================================="
echo "Summary"
echo "=================================================="
echo ""
echo "Authentication has been added to API services."
echo ""
echo "Next steps:"
echo "1. Review the changes in each service"
echo "2. Configure your domain in allowed_domains"
echo "3. Set up proper group permissions"
echo "4. Test authentication with:"
echo "   curl -H 'Authorization: Bearer YOUR_ID_TOKEN' https://your-service.run.app/api/endpoint"
echo ""
echo "To get an ID token for testing:"
echo "1. Use gcloud: gcloud auth print-identity-token"
echo "2. Or implement OAuth flow in your frontend"
