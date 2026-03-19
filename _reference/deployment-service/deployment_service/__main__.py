"""Entry point for python -m deployment_service

Supports two modes:
  - CLI mode (default):  python -m deployment_service <cli-args>
  - HTTP server mode:    python -m deployment_service --serve [--port 9000]

Suppresses third-party deprecation warnings from openbb_*, pydantic, etc.
"""

import sys
import warnings

# Suppress ALL warnings before any imports
warnings.filterwarnings("ignore")


def _run_server(port: int) -> None:
    """Start the FastAPI HTTP server."""
    import uvicorn

    from deployment_service.api.app import app

    uvicorn.run(app, host="0.0.0.0", port=port)  # nosec B104 — intentional: containerized service must bind all interfaces


def _run_cli() -> None:
    """Run the existing CLI."""
    from deployment_service.cli import cli

    cli()


if __name__ == "__main__":
    # Check for --serve before handing off to click so we don't need to
    # alter the click group signature.
    args = sys.argv[1:]
    if "--serve" in args:
        port = 9000
        if "--port" in args:
            port_idx = args.index("--port")
            if port_idx + 1 < len(args):
                port = int(args[port_idx + 1])
        _run_server(port)
    else:
        _run_cli()
