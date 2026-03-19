#!/bin/bash
#
# monitor-cloud-builds.sh - Automated Cloud Build monitoring for all 13 repos
#
# Usage:
#   ./scripts/monitor-cloud-builds.sh                    # Show summary table
#   ./scripts/monitor-cloud-builds.sh --show-logs        # Show failed build logs
#   ./scripts/monitor-cloud-builds.sh --watch            # Continuous monitoring
#   ./scripts/monitor-cloud-builds.sh --trigger-name X   # Show specific trigger
#
# Success Criteria:
#   - All 13 repos have Cloud Build triggers
#   - Recent build (within 24h) exists for each
#   - Build status is SUCCESS
#   - Image pushed to Artifact Registry
#

set -euo pipefail

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-test-project}"
REGION="asia-northeast1"
SHOW_LOGS=false
WATCH_MODE=false
SPECIFIC_TRIGGER=""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --show-logs)
            SHOW_LOGS=true
            shift
            ;;
        --watch)
            WATCH_MODE=true
            shift
            ;;
        --trigger-name)
            SPECIFIC_TRIGGER="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--show-logs] [--watch] [--trigger-name NAME]"
            exit 1
            ;;
    esac
done

# Expected repos (13 total)
REPOS=(
    "execution-services"
    "features-calendar-service"
    "features-delta-one-service"
    "features-onchain-service"
    "features-volatility-service"
    "instruments-service"
    "market-data-processing-service"
    "market-tick-data-handler"
    "ml-inference-service"
    "ml-training-service"
    "strategy-service"
    "unified-trading-library"
    "deployment-service"
)

# Function to format duration
format_duration() {
    local seconds=$1
    if [[ -z "$seconds" ]] || [[ "$seconds" == "null" ]]; then
        echo "N/A"
        return
    fi

    local minutes=$((seconds / 60))
    local secs=$((seconds % 60))
    echo "${minutes}m ${secs}s"
}

# Function to format timestamp
format_timestamp() {
    local timestamp=$1
    if [[ -z "$timestamp" ]] || [[ "$timestamp" == "null" ]]; then
        echo "Never"
        return
    fi

    # Convert to local time and show relative time
    local date_str=$(date -j -f "%Y-%m-%dT%H:%M:%S" "${timestamp%%.*}" "+%Y-%m-%d %H:%M:%S" 2>/dev/null || echo "$timestamp")
    echo "$date_str"
}

# Function to get status color
get_status_color() {
    local status=$1
    case "$status" in
        SUCCESS)
            echo -e "${GREEN}"
            ;;
        FAILURE)
            echo -e "${RED}"
            ;;
        TIMEOUT)
            echo -e "${YELLOW}"
            ;;
        WORKING|QUEUED)
            echo -e "${BLUE}"
            ;;
        *)
            echo -e "${NC}"
            ;;
    esac
}

# Function to check if trigger exists
check_trigger() {
    local repo=$1
    local trigger_name="${repo}-build"

    if gcloud builds triggers describe "$trigger_name" \
        --region="$REGION" \
        --project="$PROJECT_ID" \
        --format="value(id)" &>/dev/null; then
        echo "EXISTS"
    else
        echo "MISSING"
    fi
}

# Function to get trigger ID
get_trigger_id() {
    local repo=$1
    local trigger_name="${repo}-build"

    gcloud builds triggers describe "$trigger_name" \
        --region="$REGION" \
        --project="$PROJECT_ID" \
        --format="value(id)" 2>/dev/null || echo ""
}

# Function to get recent build for trigger
get_recent_build() {
    local trigger_id=$1

    if [[ -z "$trigger_id" ]]; then
        echo "{}"
        return
    fi

    gcloud builds list \
        --region="$REGION" \
        --project="$PROJECT_ID" \
        --filter="buildTriggerId=$trigger_id" \
        --limit=1 \
        --format=json 2>/dev/null || echo "[]"
}

# Function to show build logs
show_build_logs() {
    local build_id=$1
    local repo=$2

    echo ""
    echo -e "${BLUE}=== Logs for $repo (Build ID: $build_id) ===${NC}"
    echo ""

    gcloud builds log "$build_id" \
        --region="$REGION" \
        --project="$PROJECT_ID" 2>&1 | tail -100

    echo ""
}

# Function to generate summary table
generate_summary() {
    echo ""
    echo -e "${BLUE}=== Cloud Build Status Summary ===${NC}"
    echo -e "${BLUE}Project: $PROJECT_ID${NC}"
    echo -e "${BLUE}Region: $REGION${NC}"
    echo ""

    # Table header
    printf "%-35s %-10s %-10s %-20s %-15s %-15s\n" \
        "Repository" "Trigger" "Status" "Last Build" "Duration" "Build ID"
    printf "%-35s %-10s %-10s %-20s %-15s %-15s\n" \
        "-----------------------------------" "----------" "----------" "--------------------" "---------------" "---------------"

    local success_count=0
    local failure_count=0
    local missing_trigger_count=0
    local never_run_count=0
    local failed_builds=()

    for repo in "${REPOS[@]}"; do
        # Check if trigger exists
        local trigger_status=$(check_trigger "$repo")

        if [[ "$trigger_status" == "MISSING" ]]; then
            printf "%-35s %-10s %-10s %-20s %-15s %-15s\n" \
                "$repo" "MISSING" "-" "-" "-" "-"
            ((missing_trigger_count++))
            continue
        fi

        # Get trigger ID and recent build
        local trigger_id=$(get_trigger_id "$repo")
        local build_json=$(get_recent_build "$trigger_id")

        # Parse build data
        if [[ "$build_json" == "[]" ]] || [[ -z "$build_json" ]]; then
            printf "%-35s %-10s %-10s %-20s %-15s %-15s\n" \
                "$repo" "EXISTS" "NEVER_RUN" "-" "-" "-"
            ((never_run_count++))
            continue
        fi

        local build_id=$(echo "$build_json" | jq -r '.[0].id // "N/A"')
        local status=$(echo "$build_json" | jq -r '.[0].status // "UNKNOWN"')
        local start_time=$(echo "$build_json" | jq -r '.[0].startTime // "null"')
        local finish_time=$(echo "$build_json" | jq -r '.[0].finishTime // "null"')

        # Calculate duration
        local duration="N/A"
        if [[ "$start_time" != "null" ]] && [[ "$finish_time" != "null" ]]; then
            local start_epoch=$(date -j -f "%Y-%m-%dT%H:%M:%S" "${start_time%%.*}" "+%s" 2>/dev/null || echo "0")
            local finish_epoch=$(date -j -f "%Y-%m-%dT%H:%M:%S" "${finish_time%%.*}" "+%s" 2>/dev/null || echo "0")
            if [[ $start_epoch -gt 0 ]] && [[ $finish_epoch -gt 0 ]]; then
                local duration_seconds=$((finish_epoch - start_epoch))
                duration=$(format_duration "$duration_seconds")
            fi
        fi

        # Format timestamp
        local timestamp_str=$(format_timestamp "$start_time")

        # Count statuses
        if [[ "$status" == "SUCCESS" ]]; then
            ((success_count++))
        elif [[ "$status" == "FAILURE" ]] || [[ "$status" == "TIMEOUT" ]]; then
            ((failure_count++))
            failed_builds+=("$repo:$build_id")
        fi

        # Print row with color
        local color=$(get_status_color "$status")
        printf "%-35s %-10s ${color}%-10s${NC} %-20s %-15s %-15s\n" \
            "$repo" "EXISTS" "$status" "$timestamp_str" "$duration" "$build_id"
    done

    echo ""
    echo -e "${BLUE}=== Summary ===${NC}"
    echo -e "Total repos: ${#REPOS[@]}"
    echo -e "${GREEN}Success: $success_count${NC}"
    echo -e "${RED}Failure: $failure_count${NC}"
    echo -e "${YELLOW}Missing trigger: $missing_trigger_count${NC}"
    echo -e "${YELLOW}Never run: $never_run_count${NC}"

    # Show failed builds if requested
    if [[ "$SHOW_LOGS" == true ]] && [[ ${#failed_builds[@]} -gt 0 ]]; then
        echo ""
        echo -e "${RED}=== Failed Builds ===${NC}"
        for entry in "${failed_builds[@]}"; do
            local repo="${entry%%:*}"
            local build_id="${entry##*:}"
            show_build_logs "$build_id" "$repo"
        done
    fi

    echo ""

    # Exit with error if any failures
    if [[ $failure_count -gt 0 ]] || [[ $missing_trigger_count -gt 0 ]]; then
        echo -e "${RED}❌ Some builds failed or triggers are missing${NC}"
        return 1
    else
        echo -e "${GREEN}✅ All builds passing!${NC}"
        return 0
    fi
}

# Function to show specific trigger details
show_trigger_details() {
    local trigger_name="$1"

    echo ""
    echo -e "${BLUE}=== Trigger Details: $trigger_name ===${NC}"
    echo ""

    gcloud builds triggers describe "$trigger_name" \
        --region="$REGION" \
        --project="$PROJECT_ID" \
        --format=yaml

    echo ""
    echo -e "${BLUE}=== Recent Builds for $trigger_name ===${NC}"
    echo ""

    local trigger_id=$(gcloud builds triggers describe "$trigger_name" \
        --region="$REGION" \
        --project="$PROJECT_ID" \
        --format="value(id)" 2>/dev/null)

    gcloud builds list \
        --region="$REGION" \
        --project="$PROJECT_ID" \
        --filter="buildTriggerId=$trigger_id" \
        --limit=5 \
        --format="table(id,status,startTime,finishTime,logUrl)"
}

# Main execution
main() {
    # Check if gcloud is authenticated
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &>/dev/null; then
        echo -e "${RED}Error: gcloud is not authenticated. Run: gcloud auth login${NC}"
        exit 1
    fi

    # Check if jq is installed
    if ! command -v jq &>/dev/null; then
        echo -e "${RED}Error: jq is required but not installed. Install: brew install jq${NC}"
        exit 1
    fi

    # Show specific trigger details if requested
    if [[ -n "$SPECIFIC_TRIGGER" ]]; then
        show_trigger_details "$SPECIFIC_TRIGGER"
        exit 0
    fi

    # Watch mode - continuous monitoring
    if [[ "$WATCH_MODE" == true ]]; then
        while true; do
            clear
            generate_summary
            echo ""
            echo -e "${BLUE}Refreshing in 30 seconds... (Ctrl+C to stop)${NC}"
            sleep 30
        done
    else
        # Single run
        generate_summary
    fi
}

# Run main
main "$@"
