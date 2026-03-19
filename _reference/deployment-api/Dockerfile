# Dockerfile for deployment-api (FastAPI)
# Production image. Test-in-image uses api-dev stage for quality gates.

ARG PROJECT_ID

FROM --platform=linux/amd64 asia-northeast1-docker.pkg.dev/${PROJECT_ID}/unified-trading-library/unified-trading-library:latest AS base

FROM base AS api
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends ripgrep tini \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --system \
    && uv pip install --system --no-cache-dir gunicorn[gevent] gevent

COPY deployment_api/ ./deployment_api/
COPY gunicorn.conf.py ./
# Bundled readiness data — populated by cloudbuild before docker build;
# symlinks locally (resolved by docker build context). No-op if absent.
COPY codex-data/ ./codex-data/
COPY pm-plans/ ./pm-plans/
# Operational configs — SSOT is unified-trading-pm/configs/; populated by cloudbuild before docker build
COPY pm-configs/ ./pm-configs/
RUN id -u appuser >/dev/null 2>&1 || useradd --create-home --uid 1000 --shell /bin/bash appuser
RUN chown -R appuser:appuser /app

USER appuser
EXPOSE 8080
ENV PORT=8080
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["gunicorn", "deployment_api.main:app", "-c", "/app/gunicorn.conf.py"]

# Stage for quality gates (test-in-image)
FROM api AS api-dev
USER root
COPY scripts/ ./scripts/
COPY tests/ ./tests/
RUN uv sync --frozen --no-dev --system && chown -R appuser:appuser /app
USER appuser
