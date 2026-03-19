"""
Gunicorn configuration for production deployment.

This config is used when running the API with gunicorn (production mode).
Gunicorn manages multiple uvicorn workers for better performance and reliability.

Environment variables:
    WORKERS: Number of worker processes (default: 4)
    PORT: Port to bind to (default: 8080)
"""

from deployment_api.settings import PORT as _PORT
from deployment_api.settings import WORKERS as _WORKERS

# Server socket
bind = f"0.0.0.0:{_PORT}"
backlog = 2048

# Worker processes
# Rule of thumb: 2-4 workers per CPU core
workers = _WORKERS
worker_class = "uvicorn.workers.UvicornWorker"
worker_connections = 1000
timeout = 300  # 5 minutes for turbo data-status (instruments-service 6yr x venues can be slow)
keepalive = 5

# Graceful restart settings
graceful_timeout = 30
max_requests = 1000  # Restart worker after N requests (prevents memory leaks)
max_requests_jitter = 100  # Randomize to prevent all workers restarting at once

# Logging
accesslog = "-"  # stdout
errorlog = "-"  # stderr
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process naming
proc_name = "deployment-dashboard"

# Server mechanics
daemon = False
pidfile = None
umask = 0
user = None
group = None
tmp_upload_dir = None

# Preload app for faster worker startup (shares loaded code between workers)
preload_app = True


def pre_fork(server, worker):
    """Called just before a worker is forked."""
    pass


def post_fork(server, worker):
    """Called just after a worker has been forked."""
    pass


def pre_exec(server):
    """Called just before a new master process is forked."""
    server.log.info("Forked child, re-executing.")


def when_ready(server):
    """Called when the server is ready to accept connections."""
    server.log.info("Server is ready. Spawning workers")


def worker_int(worker):
    """Called when a worker receives INT or QUIT signal."""
    worker.log.info("worker received INT or QUIT signal")


def worker_abort(worker):
    """Called when a worker receives SIGABRT signal."""
    worker.log.info("worker received SIGABRT signal")
