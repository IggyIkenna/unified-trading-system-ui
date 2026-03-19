"""
Runtime topology SSOT validator.

Validates that runtime-topology.yaml is internally consistent and aligned with
workspace-manifest.json entity names.
"""

from __future__ import annotations

import argparse
import json
import logging
from pathlib import Path
from typing import cast

import yaml

logger = logging.getLogger(__name__)


def _load_yaml(path: Path) -> dict[str, object]:
    if not path.exists():
        raise FileNotFoundError(f"Missing YAML file: {path}")
    with open(path) as handle:
        raw = cast(object, yaml.safe_load(handle))
    if not isinstance(raw, dict):
        raise ValueError(f"Expected mapping in {path}")
    return cast(dict[str, object], raw)


def _load_json(path: Path) -> dict[str, object]:
    if not path.exists():
        raise FileNotFoundError(f"Missing JSON file: {path}")
    with open(path) as handle:
        raw = cast(object, json.load(handle))
    if not isinstance(raw, dict):
        raise ValueError(f"Expected object in {path}")
    return cast(dict[str, object], raw)


def _get_manifest_entities(workspace_manifest: dict[str, object]) -> dict[str, str]:
    repositories = workspace_manifest.get("repositories") or {}
    if not isinstance(repositories, dict):
        return {}
    entities: dict[str, str] = {}
    for name, raw in repositories.items():
        if isinstance(raw, dict):
            raw_type = raw.get("type", "unknown")
            entities[name] = str(raw_type)
    return entities


def validate_runtime_topology(
    runtime_topology_path: Path,
    workspace_manifest_path: Path,
) -> list[str]:
    topology = _load_yaml(runtime_topology_path)
    manifest = _load_json(workspace_manifest_path)
    entities = _get_manifest_entities(manifest)

    violations: list[str] = []

    required_sections = [
        "service_flows",
        "api_interactions",
        "storage_flows",
        "deployment_profiles",
        "storage_systems",
    ]
    for section in required_sections:
        if section not in topology:
            violations.append(f"Missing required section '{section}' in runtime-topology.yaml")

    services = topology.get("services") or {}
    if not isinstance(services, dict):
        violations.append("Section 'services' must be a mapping")
        services = {}

    for service_name in services:
        if service_name not in entities:
            violations.append(
                f"Unknown service in runtime topology:"
                f" '{service_name}' not found in workspace-manifest"
            )

    deployment_profiles = topology.get("deployment_profiles") or {}
    if not isinstance(deployment_profiles, dict):
        deployment_profiles = {}
    valid_transports = set()
    for profile_name, profile_cfg in deployment_profiles.items():
        if not isinstance(profile_cfg, dict):
            violations.append(f"deployment_profiles.{profile_name} must be a mapping")
            continue
        allowed = profile_cfg.get("allowed_transports") or []
        if not isinstance(allowed, list):
            violations.append(
                f"deployment_profiles.{profile_name}.allowed_transports must be a list"
            )
            continue
        valid_transports.update(str(item) for item in allowed)

    service_flows = topology.get("service_flows") or []
    if not isinstance(service_flows, list):
        violations.append("Section 'service_flows' must be a list")
        service_flows = []

    for idx, flow in enumerate(service_flows):
        if not isinstance(flow, dict):
            violations.append(f"service_flows[{idx}] must be a mapping")
            continue
        producer = str(flow.get("producer") or "")
        consumer = str(flow.get("consumer") or "")
        if producer not in entities:
            violations.append(f"service_flows[{idx}] unknown producer '{producer}'")
        if consumer not in entities:
            violations.append(f"service_flows[{idx}] unknown consumer '{consumer}'")

        modes = flow.get("modes") or {}
        if not isinstance(modes, dict):
            violations.append(f"service_flows[{idx}].modes must be a mapping")
            continue
        for mode_name, mode_cfg in modes.items():
            if not isinstance(mode_cfg, dict):
                violations.append(f"service_flows[{idx}].modes.{mode_name} must be a mapping")
                continue
            if "transport" in mode_cfg:
                transport = str(mode_cfg["transport"])
                if transport not in valid_transports:
                    violations.append(
                        f"service_flows[{idx}] transport '{transport}'"
                        f" is not allowed by any deployment profile"
                    )
            else:
                for profile_name, profile_cfg in mode_cfg.items():
                    if profile_name not in deployment_profiles:
                        violations.append(
                            f"service_flows[{idx}] unknown deployment profile"
                            f" '{profile_name}' in mode '{mode_name}'"
                        )
                        continue
                    if not isinstance(profile_cfg, dict):
                        violations.append(
                            f"service_flows[{idx}].modes.{mode_name}.{profile_name}"
                            f" must be a mapping"
                        )
                        continue
                    transport = str(profile_cfg.get("transport") or "")
                    allowed = deployment_profiles.get(profile_name, {}).get(
                        "allowed_transports", []
                    )
                    if transport and transport not in allowed:
                        violations.append(
                            f"service_flows[{idx}] transport '{transport}'"
                            f" is not allowed in profile '{profile_name}'"
                        )

    api_interactions = topology.get("api_interactions") or []
    if not isinstance(api_interactions, list):
        violations.append("Section 'api_interactions' must be a list")
        api_interactions = []
    for idx, edge in enumerate(api_interactions):
        if not isinstance(edge, dict):
            violations.append(f"api_interactions[{idx}] must be a mapping")
            continue
        caller = str(edge.get("caller") or "")
        callee = str(edge.get("callee") or "")
        if caller not in entities:
            violations.append(f"api_interactions[{idx}] unknown caller '{caller}'")
        if callee not in entities:
            violations.append(f"api_interactions[{idx}] unknown callee '{callee}'")
        elif entities[callee] != "api-service":
            violations.append(
                f"api_interactions[{idx}] callee '{callee}' must be type 'api-service'"
            )

    storage_systems = topology.get("storage_systems") or {}
    valid_stores = set(storage_systems.keys()) if isinstance(storage_systems, dict) else set()
    storage_flows = topology.get("storage_flows") or []
    if not isinstance(storage_flows, list):
        violations.append("Section 'storage_flows' must be a list")
        storage_flows = []
    for idx, flow in enumerate(storage_flows):
        if not isinstance(flow, dict):
            violations.append(f"storage_flows[{idx}] must be a mapping")
            continue
        actor = str(flow.get("actor") or "")
        store = str(flow.get("store") or "")
        if actor and actor not in entities and actor != "unified-domain-client":
            violations.append(f"storage_flows[{idx}] unknown actor '{actor}'")
        if store not in valid_stores:
            violations.append(f"storage_flows[{idx}] unknown store '{store}'")

    return violations


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate runtime-topology.yaml against workspace-manifest.json"
    )
    parser.add_argument("--runtime-topology", required=True, help="Path to runtime-topology.yaml")
    parser.add_argument(
        "--workspace-manifest", required=True, help="Path to workspace-manifest.json"
    )
    args = parser.parse_args()

    violations = validate_runtime_topology(
        runtime_topology_path=Path(cast(str, args.runtime_topology)),
        workspace_manifest_path=Path(cast(str, args.workspace_manifest)),
    )

    if violations:
        for violation in violations:
            logger.error(violation)
        return 1

    logger.info("runtime-topology.yaml is consistent with workspace-manifest.json")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
