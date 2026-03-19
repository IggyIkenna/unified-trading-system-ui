#!/usr/bin/env python3
"""
Check Cloud Build config against all documented resource limits.

Cloud Build quotas: https://cloud.google.com/build/quotas

Validated limits (from build config YAML):
- args values per build step: 100
- Build steps per build: 300
- Built images per build: 700
- env values per build step: 100
- Length of each arg value: 10000 characters
- Length of build step name: 1000 characters
- Length of dir value: 1000 characters
- Length of each env value: 65536 characters
- Number of tags per build: 64
- Number of artifact paths per build: 100
- Number of substitution parameters: 200
- Unique secretEnv values per build: 100

Not validated (require runtime/project context):
- Number of build triggers: 600 (project-level)
- Size of a secret: 65536 (secret value not in YAML)

Usage:
  python check_cloudbuild_args_limit.py                    # Check cloudbuild.yaml in cwd
  python check_cloudbuild_args_limit.py path/to/cloudbuild.yaml
  python check_cloudbuild_args_limit.py path1 path2 ...    # Check multiple files
  python check_cloudbuild_args_limit.py --verbose ...      # Show per-step counts
"""

import logging
import sys
from pathlib import Path

import yaml

logger = logging.getLogger(__name__)

# Cloud Build quotas - https://cloud.google.com/build/quotas
LIMITS = {
    "args_per_step": 100,
    "steps_per_build": 300,
    "images_per_build": 700,
    "env_per_step": 100,
    "arg_value_length": 10000,
    "step_name_length": 1000,
    "dir_length": 1000,
    "env_value_length": 65536,
    "tags_per_build": 64,
    "artifact_paths_per_build": 100,
    "substitution_params": 200,
    "secret_env_per_build": 100,
}


def _count_artifact_paths(artifacts: dict) -> int:
    """Count artifact paths. Structure: objects: [{paths: [...]}] or similar."""
    if not artifacts:
        return 0
    total = 0
    objs = artifacts.get("objects") or []
    for obj in objs:
        paths = obj.get("paths") if isinstance(obj, dict) else None
        if paths:
            total += len(paths) if isinstance(paths, list) else 1
    return total


def _collect_secret_env_refs(data: dict) -> set:
    """Collect unique secretEnv variable names across build."""
    refs = set()

    def add_names(val):
        if isinstance(val, list):
            for x in val:
                if isinstance(x, dict):
                    n = x.get("env") or x.get("versionName")
                    if n:
                        refs.add(str(n))
                elif x:
                    refs.add(str(x))
        elif val:
            refs.add(str(val))

    for step in data.get("steps") or []:
        add_names(step.get("secretEnv"))

    opts = data.get("options") or {}
    add_names(opts.get("secretEnv"))

    for ent in (data.get("availableSecrets") or {}).get("secretManager") or []:
        if isinstance(ent, dict) and ent.get("env"):
            refs.add(ent["env"])

    return refs


def _effective_args_count(args: list) -> int:
    """
    Estimate effective args for Cloud Build quota.

    Cloud Build may expand --set-env-vars KEY1=v1,KEY2=v2,... internally
    (observed: 32 YAML args -> 104 at runtime). Add penalty for comma-separated
    env pairs so we catch configs that would fail at build time.
    """
    n = len(args)
    for j, arg in enumerate(args):
        if str(arg).strip() == "--set-env-vars" and j + 1 < len(args):
            val = str(args[j + 1])
            # Count KEY=VALUE pairs (comma-separated)
            pairs = [x for x in val.split(",") if "=" in x]
            num_pairs = len(pairs) or 1
            # Empirical: ~7 effective args per env pair at Cloud Build runtime
            n += num_pairs * 7
            break  # Only count first --set-env-vars per step
    return n


def check_cloudbuild(path: Path, verbose: bool = False) -> bool:
    """Check a single cloudbuild.yaml. Returns True if OK."""
    try:
        data = yaml.safe_load(path.read_text())
    except (ValueError, KeyError, TypeError):
        return False

    steps = data.get("steps") or []
    ok = True

    # Build-level limits
    if len(steps) > LIMITS["steps_per_build"]:
        logger.info(f"❌ {path}: {len(steps)} steps (max {LIMITS['steps_per_build']})")
        ok = False

    images = data.get("images") or []
    if len(images) > LIMITS["images_per_build"]:
        logger.info(f"❌ {path}: {len(images)} images (max {LIMITS['images_per_build']})")
        ok = False

    tags = data.get("tags") or []
    if len(tags) > LIMITS["tags_per_build"]:
        logger.info(f"❌ {path}: {len(tags)} tags (max {LIMITS['tags_per_build']})")
        ok = False

    artifact_count = _count_artifact_paths(data.get("artifacts") or {})
    if artifact_count > LIMITS["artifact_paths_per_build"]:
        logger.info(
            f"❌ {path}: {artifact_count} artifact paths (max {LIMITS['artifact_paths_per_build']})"
        )
        ok = False

    subs = data.get("substitutions") or {}
    if len(subs) > LIMITS["substitution_params"]:
        logger.info(
            f"❌ {path}: {len(subs)} substitution params (max {LIMITS['substitution_params']})"
        )
        ok = False

    secret_refs = _collect_secret_env_refs(data)
    if len(secret_refs) > LIMITS["secret_env_per_build"]:
        logger.info(
            f"❌ {path}: {len(secret_refs)} unique secretEnv refs (max {LIMITS['secret_env_per_build']})"
        )
        ok = False

    # Step-level limits
    for i, step in enumerate(steps):
        step_id = step.get("id", f"step-{i + 1}")
        args = step.get("args") or []
        env = step.get("env") or []

        effective_args = _effective_args_count(args)

        if verbose:
            extra = f" (effective {effective_args})" if effective_args != len(args) else ""
            status = "⚠️" if effective_args > 80 or len(env) > 80 else "✓"
            logger.info(
                f"  {path.name} Step {i + 1} ({step_id}): args={len(args)}{extra}, env={len(env)} {status}"
            )

        if effective_args > LIMITS["args_per_step"]:
            msg = f"Step {i + 1} ({step_id}) has {effective_args} effective args (max {LIMITS['args_per_step']})"
            if effective_args != len(args):
                msg += f" [raw YAML: {len(args)} + --set-env-vars expansion penalty]"
            logger.info(f"❌ {path}: {msg}")
            ok = False
        if len(env) > LIMITS["env_per_step"]:
            logger.info(
                f"❌ {path}: Step {i + 1} ({step_id}) has {len(env)} env vars (max {LIMITS['env_per_step']})"
            )
            ok = False

        for j, arg in enumerate(args):
            if len(str(arg)) > LIMITS["arg_value_length"]:
                logger.info(
                    f"❌ {path}: Step {i + 1} ({step_id}) arg[{j}] length {len(str(arg))} "
                    f"(max {LIMITS['arg_value_length']})"
                )
                ok = False

        name_val = step.get("name") or ""
        if len(str(name_val)) > LIMITS["step_name_length"]:
            logger.info(
                f"❌ {path}: Step {i + 1} ({step_id}) name length {len(str(name_val))} "
                f"(max {LIMITS['step_name_length']})"
            )
            ok = False

        dir_val = step.get("dir") or ""
        if dir_val and len(str(dir_val)) > LIMITS["dir_length"]:
            logger.info(
                f"❌ {path}: Step {i + 1} ({step_id}) dir length {len(str(dir_val))} (max {LIMITS['dir_length']})"
            )
            ok = False

        for j, ev in enumerate(env):
            if len(str(ev)) > LIMITS["env_value_length"]:
                logger.info(
                    f"❌ {path}: Step {i + 1} ({step_id}) env[{j}] length {len(str(ev))} "
                    f"(max {LIMITS['env_value_length']})"
                )
                ok = False

    return ok


def main() -> int:
    logging.basicConfig(level=logging.INFO)
    argv = list(sys.argv[1:])
    verbose = False
    if "--verbose" in argv or "-v" in argv:
        verbose = True
        argv = [a for a in argv if a not in ("--verbose", "-v")]

    if argv:
        paths = [Path(p) for p in argv]
    else:
        paths = [Path("cloudbuild.yaml")]
        if not paths[0].exists():
            logger.info("No cloudbuild.yaml in cwd; pass path(s) as arguments")
            return 0  # Skip, not fail

    if verbose:
        logger.info("Cloud Build limits (cloud.google.com/build/quotas):")
        for k, v in LIMITS.items():
            logger.info(f"  {k}: {v}")
        logger.info()

    all_ok = True
    for p in paths:
        p = Path(p).resolve()
        if not p.exists():
            logger.info(f"❌ {p}: File not found")
            all_ok = False
            continue
        if not check_cloudbuild(p, verbose=verbose):
            all_ok = False

    if all_ok and paths:
        logger.info("✅ All Cloud Build limits satisfied")
    return 0 if all_ok else 1


if __name__ == "__main__":
    sys.exit(main())
