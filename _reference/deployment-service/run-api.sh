#!/bin/bash
# Run the deployment dashboard (backend API + frontend)
#
# Modes:
#   dev      - Backend only with hot reload (default)
#   prod     - Backend only with 4 workers for production
#   frontend - Frontend only (Vite dev server)
#   all      - Both backend and frontend for full local development

set -e

cd "$(dirname "$0")"

# Source environment variables from .env.local (local development config)
if [ -f .env.local ]; then
    set -a  # Auto-export all variables
    source .env.local
    set +a
    echo "✓ Loaded environment from .env.local"
else
    echo "⚠ No .env.local file found — copy .env.example to .env.local and adjust for local dev"
fi

MODE="${1:-dev}"

# Kill any existing processes on our ports
kill_existing() {
    echo "Checking for existing processes..."
    local backend_port="${API_PORT:-8000}"
    local frontend_port="${FRONTEND_PORT:-5173}"

    # Kill backend on configured port
    BACKEND_PIDS=$(lsof -ti:${backend_port} 2>/dev/null || true)
    if [ -n "$BACKEND_PIDS" ]; then
        echo "  Killing existing backend processes on port ${backend_port}: $BACKEND_PIDS"
        echo "$BACKEND_PIDS" | xargs kill -9 2>/dev/null || true
        sleep 1
    fi

    # Kill frontend on configured port
    FRONTEND_PIDS=$(lsof -ti:${frontend_port} 2>/dev/null || true)
    if [ -n "$FRONTEND_PIDS" ]; then
        echo "  Killing existing frontend processes on port ${frontend_port}: $FRONTEND_PIDS"
        echo "$FRONTEND_PIDS" | xargs kill -9 2>/dev/null || true
        sleep 1
    fi

    # Also kill any uvicorn or vite processes related to this project
    pkill -f "uvicorn api.main:app" 2>/dev/null || true
    pkill -f "deployment-service/ui" 2>/dev/null || true

    echo "  Clean start ready."
}

# Cleanup function to kill background processes on exit
cleanup() {
    echo ""
    echo "Shutting down..."
    [ -n "$BACKEND_PID" ] && kill $BACKEND_PID 2>/dev/null
    [ -n "$FRONTEND_PID" ] && kill $FRONTEND_PID 2>/dev/null
    exit 0
}

start_backend() {
    local port="${API_PORT:-8000}"
    echo "Starting backend API on http://127.0.0.1:${port}..."
    # Stability improvements:
    # --reload-exclude: Exclude tests, scripts, and cache files to prevent unwanted reloads
    # --reload-delay: Add 0.5s delay to prevent rapid-fire reloads
    uvicorn api.main:app \
        --reload \
        --port "${port}" \
        --reload-exclude "tests/*" \
        --reload-exclude "scripts/*" \
        --reload-exclude "*.pyc" \
        --reload-exclude "__pycache__/*" \
        --reload-exclude "docs/*" \
        --reload-exclude "terraform/*" \
        --reload-delay 0.5
}

start_frontend() {
    echo "Starting frontend on http://localhost:5173..."
    cd ui && npm run dev
}

if [ "$MODE" = "prod" ]; then
    kill_existing
    port="${API_PORT:-8000}"
    workers="${WORKERS:-4}"
    echo "Starting API in production mode (${workers} workers)..."
    uvicorn api.main:app \
        --host 0.0.0.0 \
        --port "${port}" \
        --workers "${workers}" \
        --timeout-keep-alive 650 \
        --limit-concurrency 1000 \
        --backlog 2048

elif [ "$MODE" = "dev" ]; then
    kill_existing
    echo "Starting API in development mode (single worker with reload)..."
    start_backend

elif [ "$MODE" = "frontend" ]; then
    kill_existing
    start_frontend

elif [ "$MODE" = "all" ]; then
    kill_existing
    echo "Starting full development environment..."
    echo "  Backend:  http://127.0.0.1:${API_PORT:-8000}"
    echo "  Frontend: http://localhost:${FRONTEND_PORT:-5173}"
    echo ""

    # Set up cleanup trap
    trap cleanup SIGINT SIGTERM

    # Start backend in background
    start_backend &
    BACKEND_PID=$!

    # Wait for backend to start
    sleep 3

    # Start frontend in background
    start_frontend &
    FRONTEND_PID=$!

    echo ""
    echo "Both servers running. Press Ctrl+C to stop."

    # Wait for either process to exit
    wait

else
    echo "Usage: $0 [dev|prod|frontend|all]"
    echo ""
    echo "Modes:"
    echo "  dev      - Backend only with hot reload (default)"
    echo "  prod     - Backend only with 4 workers"
    echo "  frontend - Frontend only (Vite dev server)"
    echo "  all      - Both backend and frontend"
    exit 1
fi
