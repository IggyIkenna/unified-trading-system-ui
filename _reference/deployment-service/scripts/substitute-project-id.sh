#!/bin/bash
#
# Dynamic Project ID Substitution Script
#
# This script replaces ${PROJECT_ID} placeholders in configuration files
# with the actual project ID from the unified trading library project_config.
#
# Usage:
#   ./scripts/substitute-project-id.sh [target_file_or_directory]
#
# Features:
# - Automatically detects project ID via project_config
# - Supports both individual files and directories
# - Creates .bak backup files
# - Safe substitution using temporary files
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Get project ID using Python with project_config
get_project_id() {
    local project_id

    log "Resolving project ID using unified_trading_library.project_config..."

    # Try to get project ID using the project_config module
    project_id=$(python3 -c "
import sys
import os
sys.path.insert(0, os.path.join('$REPO_ROOT', '..', 'unified-trading-library'))
try:
    from unified_trading_library import project_config
    print(project_config.project_id)
except Exception as e:
    # Fallback to environment variable
    import os
    project_id = os.getenv('GCP_PROJECT_ID', '')
    if not project_id:
        print('GCP_PROJECT_ID not set', file=sys.stderr)
        sys.exit(1)
    print(project_id)
" 2>/dev/null) || {
        error "Failed to resolve project ID"
        error "Please ensure:"
        error "1. unified-trading-library is available in parent directory"
        error "2. GCP_PROJECT_ID environment variable is set"
        error "3. Secret Manager is configured with 'gcp-project-id' secret"
        return 1
    }

    if [[ -z "$project_id" ]]; then
        error "Project ID resolved to empty string"
        return 1
    fi

    echo "$project_id"
}

# Substitute PROJECT_ID in a single file
substitute_file() {
    local file="$1"
    local project_id="$2"

    if [[ ! -f "$file" ]]; then
        warn "File not found: $file"
        return 1
    fi

    # Check if file contains the placeholder
    if ! grep -q '\${PROJECT_ID}' "$file"; then
        log "No \${PROJECT_ID} placeholders found in: $file"
        return 0
    fi

    log "Substituting \${PROJECT_ID} -> $project_id in: $file"

    # Create backup
    cp "$file" "$file.bak"

    # Perform substitution using sed with proper escaping
    sed "s/\${PROJECT_ID}/$project_id/g" "$file.bak" > "$file"

    success "Updated: $file (backup: $file.bak)"
}

# Substitute PROJECT_ID in directory recursively
substitute_directory() {
    local dir="$1"
    local project_id="$2"

    if [[ ! -d "$dir" ]]; then
        error "Directory not found: $dir"
        return 1
    fi

    log "Processing directory: $dir"

    # Find files that likely contain PROJECT_ID placeholders
    local files
    files=$(find "$dir" -type f \( -name "*.tfvars" -o -name "*.tf" -o -name "*.yaml" -o -name "*.yml" -o -name "*.json" -o -name "*.env*" \) 2>/dev/null | head -50)

    if [[ -z "$files" ]]; then
        warn "No configuration files found in: $dir"
        return 0
    fi

    local count=0
    while IFS= read -r file; do
        if substitute_file "$file" "$project_id"; then
            ((count++))
        fi
    done <<< "$files"

    success "Processed $count files in: $dir"
}

# Main function
main() {
    local target="${1:-terraform}"

    log "=== Dynamic Project ID Substitution ==="
    log "Target: $target"

    # Resolve project ID
    local project_id
    project_id=$(get_project_id) || {
        error "Failed to resolve project ID"
        exit 1
    }

    success "Resolved project ID: $project_id"

    # Determine target path
    local target_path
    if [[ "$target" == /* ]]; then
        target_path="$target"  # Absolute path
    elif [[ -f "$target" ]] || [[ -d "$target" ]]; then
        target_path="$(pwd)/$target"  # Relative to current directory
    else
        target_path="$REPO_ROOT/$target"  # Relative to repo root
    fi

    log "Target path: $target_path"

    # Process target
    if [[ -f "$target_path" ]]; then
        substitute_file "$target_path" "$project_id"
    elif [[ -d "$target_path" ]]; then
        substitute_directory "$target_path" "$project_id"
    else
        error "Target not found: $target_path"
        exit 1
    fi

    success "=== Project ID substitution completed ==="
    log "To restore original files, use: find $target_path -name '*.bak' -exec sh -c 'mv \"\$1\" \"\${1%.bak}\"' _ {} \;"
}

# Show help
show_help() {
    cat << EOF
Dynamic Project ID Substitution Script

Usage:
    $0 [target_file_or_directory]

Examples:
    $0                                          # Process default terraform directory
    $0 terraform/services                       # Process specific directory
    $0 terraform/services/strategy/terraform.tfvars  # Process specific file
    $0 /absolute/path/to/config.yaml           # Process absolute path

The script will:
1. Resolve project ID using unified_trading_library.project_config
2. Replace all \${PROJECT_ID} placeholders with actual project ID
3. Create .bak backup files
4. Show summary of changes

Environment Variables:
    GCP_PROJECT_ID    Fallback project ID if project_config fails

Options:
    -h, --help       Show this help message
EOF
}

# Check arguments
if [[ "${1:-}" == "-h" ]] || [[ "${1:-}" == "--help" ]]; then
    show_help
    exit 0
fi

# Run main function
main "$@"
