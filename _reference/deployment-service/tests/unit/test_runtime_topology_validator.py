"""Tests for runtime topology validator."""

import json

import yaml

from deployment_service.runtime_topology_validator import validate_runtime_topology


def test_runtime_topology_validation_passes_for_valid_minimum(tmp_path):
    runtime_topology = {
        "deployment_profiles": {
            "distributed": {"allowed_transports": ["gcs", "pubsub"]},
            "co_located_vm": {"allowed_transports": ["gcs", "pubsub", "in_memory"]},
        },
        "storage_systems": {"gcs": {}, "redis": {}, "bigquery": {}},
        "services": {"market-data-processing-service": {}},
        "service_flows": [
            {
                "producer": "market-tick-data-service",
                "consumer": "market-data-processing-service",
                "modes": {
                    "batch": {"transport": "gcs"},
                    "live": {
                        "distributed": {"transport": "pubsub"},
                        "co_located_vm": {"transport": "in_memory"},
                    },
                },
            }
        ],
        "api_interactions": [
            {
                "caller": "trading-analytics-ui",
                "callee": "execution-results-api",
                "protocol": "sse",
            }
        ],
        "storage_flows": [
            {"actor": "market-data-processing-service", "store": "gcs"},
        ],
    }

    workspace_manifest = {
        "repositories": {
            "market-tick-data-service": {"type": "service"},
            "market-data-processing-service": {"type": "service"},
            "execution-results-api": {"type": "api-service"},
            "trading-analytics-ui": {"type": "ui"},
        }
    }

    runtime_path = tmp_path / "runtime-topology.yaml"
    manifest_path = tmp_path / "workspace-manifest.json"
    runtime_path.write_text(yaml.safe_dump(runtime_topology))
    manifest_path.write_text(json.dumps(workspace_manifest))

    violations = validate_runtime_topology(runtime_path, manifest_path)
    assert violations == []


def test_runtime_topology_validation_fails_on_unknown_entities(tmp_path):
    runtime_topology = {
        "deployment_profiles": {"distributed": {"allowed_transports": ["gcs", "pubsub"]}},
        "storage_systems": {"gcs": {}},
        "services": {"unknown-service": {}},
        "service_flows": [],
        "api_interactions": [],
        "storage_flows": [],
    }
    workspace_manifest = {"repositories": {}}

    runtime_path = tmp_path / "runtime-topology.yaml"
    manifest_path = tmp_path / "workspace-manifest.json"
    runtime_path.write_text(yaml.safe_dump(runtime_topology))
    manifest_path.write_text(json.dumps(workspace_manifest))

    violations = validate_runtime_topology(runtime_path, manifest_path)
    assert any("unknown-service" in item for item in violations)


def test_load_yaml_missing_file(tmp_path):
    import pytest

    from deployment_service.runtime_topology_validator import _load_yaml

    with pytest.raises(FileNotFoundError):
        _load_yaml(tmp_path / "nonexistent.yaml")


def test_load_yaml_non_mapping(tmp_path):
    import pytest

    from deployment_service.runtime_topology_validator import _load_yaml

    p = tmp_path / "bad.yaml"
    p.write_text("- item1\n- item2\n")
    with pytest.raises(ValueError, match="Expected mapping"):
        _load_yaml(p)


def test_load_json_missing_file(tmp_path):
    import pytest

    from deployment_service.runtime_topology_validator import _load_json

    with pytest.raises(FileNotFoundError):
        _load_json(tmp_path / "nonexistent.json")


def test_load_json_non_mapping(tmp_path):
    import json

    import pytest

    from deployment_service.runtime_topology_validator import _load_json

    p = tmp_path / "bad.json"
    p.write_text(json.dumps([1, 2, 3]))
    with pytest.raises(ValueError, match="Expected object"):
        _load_json(p)


def test_get_manifest_entities_non_dict_repos(tmp_path):
    from deployment_service.runtime_topology_validator import _get_manifest_entities

    result = _get_manifest_entities({"repositories": "not-a-dict"})
    assert result == {}


def test_missing_required_sections(tmp_path):
    import json

    import yaml

    runtime_topology = {"services": {}, "service_flows": [], "api_interactions": []}
    workspace_manifest = {"repositories": {}}
    runtime_path = tmp_path / "rt.yaml"
    manifest_path = tmp_path / "wm.json"
    runtime_path.write_text(yaml.safe_dump(runtime_topology))
    manifest_path.write_text(json.dumps(workspace_manifest))
    violations = validate_runtime_topology(runtime_path, manifest_path)
    assert any("storage_flows" in v for v in violations)
    assert any("deployment_profiles" in v for v in violations)
    assert any("storage_systems" in v for v in violations)


def test_services_not_a_mapping(tmp_path):
    import json

    import yaml

    runtime_topology = {
        "deployment_profiles": {},
        "storage_systems": {},
        "services": "not-a-dict",
        "service_flows": [],
        "api_interactions": [],
        "storage_flows": [],
    }
    workspace_manifest = {"repositories": {}}
    runtime_path = tmp_path / "rt.yaml"
    manifest_path = tmp_path / "wm.json"
    runtime_path.write_text(yaml.safe_dump(runtime_topology))
    manifest_path.write_text(json.dumps(workspace_manifest))
    violations = validate_runtime_topology(runtime_path, manifest_path)
    assert any("services" in v for v in violations)


def test_deployment_profile_not_a_mapping(tmp_path):
    import json

    import yaml

    runtime_topology = {
        "deployment_profiles": {"bad_profile": "not-a-dict"},
        "storage_systems": {},
        "services": {},
        "service_flows": [],
        "api_interactions": [],
        "storage_flows": [],
    }
    workspace_manifest = {"repositories": {}}
    runtime_path = tmp_path / "rt.yaml"
    manifest_path = tmp_path / "wm.json"
    runtime_path.write_text(yaml.safe_dump(runtime_topology))
    manifest_path.write_text(json.dumps(workspace_manifest))
    violations = validate_runtime_topology(runtime_path, manifest_path)
    assert any("bad_profile" in v and "mapping" in v for v in violations)


def test_deployment_profile_allowed_transports_not_list(tmp_path):
    import json

    import yaml

    runtime_topology = {
        "deployment_profiles": {"p": {"allowed_transports": "not-a-list"}},
        "storage_systems": {},
        "services": {},
        "service_flows": [],
        "api_interactions": [],
        "storage_flows": [],
    }
    workspace_manifest = {"repositories": {}}
    runtime_path = tmp_path / "rt.yaml"
    manifest_path = tmp_path / "wm.json"
    runtime_path.write_text(yaml.safe_dump(runtime_topology))
    manifest_path.write_text(json.dumps(workspace_manifest))
    violations = validate_runtime_topology(runtime_path, manifest_path)
    assert any("allowed_transports" in v for v in violations)


def test_service_flows_not_a_list(tmp_path):
    import json

    import yaml

    runtime_topology = {
        "deployment_profiles": {},
        "storage_systems": {},
        "services": {},
        "service_flows": "not-a-list",
        "api_interactions": [],
        "storage_flows": [],
    }
    workspace_manifest = {"repositories": {}}
    runtime_path = tmp_path / "rt.yaml"
    manifest_path = tmp_path / "wm.json"
    runtime_path.write_text(yaml.safe_dump(runtime_topology))
    manifest_path.write_text(json.dumps(workspace_manifest))
    violations = validate_runtime_topology(runtime_path, manifest_path)
    assert any("service_flows" in v for v in violations)


def test_service_flow_entry_not_mapping(tmp_path):
    import json

    import yaml

    runtime_topology = {
        "deployment_profiles": {},
        "storage_systems": {},
        "services": {},
        "service_flows": ["not-a-dict"],
        "api_interactions": [],
        "storage_flows": [],
    }
    workspace_manifest = {"repositories": {}}
    runtime_path = tmp_path / "rt.yaml"
    manifest_path = tmp_path / "wm.json"
    runtime_path.write_text(yaml.safe_dump(runtime_topology))
    manifest_path.write_text(json.dumps(workspace_manifest))
    violations = validate_runtime_topology(runtime_path, manifest_path)
    assert any("service_flows[0]" in v for v in violations)


def test_service_flow_modes_not_mapping(tmp_path):
    import json

    import yaml

    runtime_topology = {
        "deployment_profiles": {},
        "storage_systems": {},
        "services": {},
        "service_flows": [{"producer": "a", "consumer": "b", "modes": "bad"}],
        "api_interactions": [],
        "storage_flows": [],
    }
    workspace_manifest = {"repositories": {}}
    runtime_path = tmp_path / "rt.yaml"
    manifest_path = tmp_path / "wm.json"
    runtime_path.write_text(yaml.safe_dump(runtime_topology))
    manifest_path.write_text(json.dumps(workspace_manifest))
    violations = validate_runtime_topology(runtime_path, manifest_path)
    assert any("modes" in v for v in violations)


def test_service_flow_unknown_transport(tmp_path):
    import json

    import yaml

    runtime_topology = {
        "deployment_profiles": {"p": {"allowed_transports": ["gcs"]}},
        "storage_systems": {},
        "services": {},
        "service_flows": [
            {"producer": "svc-a", "consumer": "svc-b", "modes": {"batch": {"transport": "kafka"}}}
        ],
        "api_interactions": [],
        "storage_flows": [],
    }
    workspace_manifest = {
        "repositories": {"svc-a": {"type": "service"}, "svc-b": {"type": "service"}}
    }
    runtime_path = tmp_path / "rt.yaml"
    manifest_path = tmp_path / "wm.json"
    runtime_path.write_text(yaml.safe_dump(runtime_topology))
    manifest_path.write_text(json.dumps(workspace_manifest))
    violations = validate_runtime_topology(runtime_path, manifest_path)
    assert any("kafka" in v for v in violations)


def test_api_interactions_not_list(tmp_path):
    import json

    import yaml

    runtime_topology = {
        "deployment_profiles": {},
        "storage_systems": {},
        "services": {},
        "service_flows": [],
        "api_interactions": "bad",
        "storage_flows": [],
    }
    workspace_manifest = {"repositories": {}}
    runtime_path = tmp_path / "rt.yaml"
    manifest_path = tmp_path / "wm.json"
    runtime_path.write_text(yaml.safe_dump(runtime_topology))
    manifest_path.write_text(json.dumps(workspace_manifest))
    violations = validate_runtime_topology(runtime_path, manifest_path)
    assert any("api_interactions" in v for v in violations)


def test_api_interaction_callee_wrong_type(tmp_path):
    import json

    import yaml

    runtime_topology = {
        "deployment_profiles": {},
        "storage_systems": {},
        "services": {},
        "service_flows": [],
        "api_interactions": [{"caller": "svc-a", "callee": "svc-b"}],
        "storage_flows": [],
    }
    workspace_manifest = {
        "repositories": {"svc-a": {"type": "service"}, "svc-b": {"type": "service"}}
    }
    runtime_path = tmp_path / "rt.yaml"
    manifest_path = tmp_path / "wm.json"
    runtime_path.write_text(yaml.safe_dump(runtime_topology))
    manifest_path.write_text(json.dumps(workspace_manifest))
    violations = validate_runtime_topology(runtime_path, manifest_path)
    assert any("api-service" in v and "svc-b" in v for v in violations)


def test_storage_flows_not_list(tmp_path):
    import json

    import yaml

    runtime_topology = {
        "deployment_profiles": {},
        "storage_systems": {},
        "services": {},
        "service_flows": [],
        "api_interactions": [],
        "storage_flows": "bad",
    }
    workspace_manifest = {"repositories": {}}
    runtime_path = tmp_path / "rt.yaml"
    manifest_path = tmp_path / "wm.json"
    runtime_path.write_text(yaml.safe_dump(runtime_topology))
    manifest_path.write_text(json.dumps(workspace_manifest))
    violations = validate_runtime_topology(runtime_path, manifest_path)
    assert any("storage_flows" in v for v in violations)


def test_storage_flow_unknown_store(tmp_path):
    import json

    import yaml

    runtime_topology = {
        "deployment_profiles": {},
        "storage_systems": {"gcs": {}},
        "services": {},
        "service_flows": [],
        "api_interactions": [],
        "storage_flows": [{"actor": "svc-a", "store": "unknown-store"}],
    }
    workspace_manifest = {"repositories": {"svc-a": {"type": "service"}}}
    runtime_path = tmp_path / "rt.yaml"
    manifest_path = tmp_path / "wm.json"
    runtime_path.write_text(yaml.safe_dump(runtime_topology))
    manifest_path.write_text(json.dumps(workspace_manifest))
    violations = validate_runtime_topology(runtime_path, manifest_path)
    assert any("unknown-store" in v for v in violations)


def test_service_flow_mode_not_mapping(tmp_path):
    import json

    import yaml

    runtime_topology = {
        "deployment_profiles": {"p": {"allowed_transports": ["gcs"]}},
        "storage_systems": {},
        "services": {},
        "service_flows": [
            {"producer": "svc-a", "consumer": "svc-b", "modes": {"batch": {"p": "not-a-dict"}}}
        ],
        "api_interactions": [],
        "storage_flows": [],
    }
    workspace_manifest = {
        "repositories": {"svc-a": {"type": "service"}, "svc-b": {"type": "service"}}
    }
    runtime_path = tmp_path / "rt.yaml"
    manifest_path = tmp_path / "wm.json"
    runtime_path.write_text(yaml.safe_dump(runtime_topology))
    manifest_path.write_text(json.dumps(workspace_manifest))
    violations = validate_runtime_topology(runtime_path, manifest_path)
    # "p" is a known profile but profile_cfg is not dict → violation
    assert any("mapping" in v for v in violations)


def test_main_no_violations(tmp_path, capsys, monkeypatch):
    import json
    import sys

    import yaml

    from deployment_service.runtime_topology_validator import main

    runtime_topology = {
        "deployment_profiles": {"p": {"allowed_transports": ["gcs"]}},
        "storage_systems": {"gcs": {}},
        "services": {},
        "service_flows": [],
        "api_interactions": [],
        "storage_flows": [],
    }
    workspace_manifest = {"repositories": {}}
    runtime_path = tmp_path / "rt.yaml"
    manifest_path = tmp_path / "wm.json"
    runtime_path.write_text(yaml.safe_dump(runtime_topology))
    manifest_path.write_text(json.dumps(workspace_manifest))

    monkeypatch.setattr(
        sys,
        "argv",
        [
            "prog",
            "--runtime-topology",
            str(runtime_path),
            "--workspace-manifest",
            str(manifest_path),
        ],
    )
    result = main()
    assert result == 0


def test_main_with_violations(tmp_path, capsys, monkeypatch):
    import json
    import sys

    import yaml

    from deployment_service.runtime_topology_validator import main

    runtime_topology = {
        "deployment_profiles": {},
        "storage_systems": {},
        "services": {"unknown-svc": {}},
        "service_flows": [],
        "api_interactions": [],
        "storage_flows": [],
    }
    workspace_manifest = {"repositories": {}}
    runtime_path = tmp_path / "rt.yaml"
    manifest_path = tmp_path / "wm.json"
    runtime_path.write_text(yaml.safe_dump(runtime_topology))
    manifest_path.write_text(json.dumps(workspace_manifest))

    monkeypatch.setattr(
        sys,
        "argv",
        [
            "prog",
            "--runtime-topology",
            str(runtime_path),
            "--workspace-manifest",
            str(manifest_path),
        ],
    )
    result = main()
    assert result == 1


def test_api_interaction_entry_not_mapping(tmp_path):
    import json

    import yaml

    runtime_topology = {
        "deployment_profiles": {},
        "storage_systems": {},
        "services": {},
        "service_flows": [],
        "api_interactions": ["not-a-dict"],
        "storage_flows": [],
    }
    workspace_manifest = {"repositories": {}}
    runtime_path = tmp_path / "rt.yaml"
    manifest_path = tmp_path / "wm.json"
    runtime_path.write_text(yaml.safe_dump(runtime_topology))
    manifest_path.write_text(json.dumps(workspace_manifest))
    violations = validate_runtime_topology(runtime_path, manifest_path)
    assert any("api_interactions[0]" in v for v in violations)


def test_storage_flow_entry_not_mapping(tmp_path):
    import json

    import yaml

    runtime_topology = {
        "deployment_profiles": {},
        "storage_systems": {"gcs": {}},
        "services": {},
        "service_flows": [],
        "api_interactions": [],
        "storage_flows": ["not-a-dict"],
    }
    workspace_manifest = {"repositories": {}}
    runtime_path = tmp_path / "rt.yaml"
    manifest_path = tmp_path / "wm.json"
    runtime_path.write_text(yaml.safe_dump(runtime_topology))
    manifest_path.write_text(json.dumps(workspace_manifest))
    violations = validate_runtime_topology(runtime_path, manifest_path)
    assert any("storage_flows[0]" in v for v in violations)


def test_storage_flow_unknown_actor(tmp_path):
    import json

    import yaml

    runtime_topology = {
        "deployment_profiles": {},
        "storage_systems": {"gcs": {}},
        "services": {},
        "service_flows": [],
        "api_interactions": [],
        "storage_flows": [{"actor": "unknown-actor", "store": "gcs"}],
    }
    workspace_manifest = {"repositories": {}}
    runtime_path = tmp_path / "rt.yaml"
    manifest_path = tmp_path / "wm.json"
    runtime_path.write_text(yaml.safe_dump(runtime_topology))
    manifest_path.write_text(json.dumps(workspace_manifest))
    violations = validate_runtime_topology(runtime_path, manifest_path)
    assert any("unknown-actor" in v for v in violations)


def test_service_flow_mode_unknown_profile(tmp_path):
    import json

    import yaml

    runtime_topology = {
        "deployment_profiles": {"valid_profile": {"allowed_transports": ["gcs"]}},
        "storage_systems": {},
        "services": {},
        "service_flows": [
            {
                "producer": "svc-a",
                "consumer": "svc-b",
                "modes": {"live": {"unknown-profile": {"transport": "gcs"}}},
            }
        ],
        "api_interactions": [],
        "storage_flows": [],
    }
    workspace_manifest = {
        "repositories": {"svc-a": {"type": "service"}, "svc-b": {"type": "service"}}
    }
    runtime_path = tmp_path / "rt.yaml"
    manifest_path = tmp_path / "wm.json"
    runtime_path.write_text(yaml.safe_dump(runtime_topology))
    manifest_path.write_text(json.dumps(workspace_manifest))
    violations = validate_runtime_topology(runtime_path, manifest_path)
    assert any("unknown-profile" in v for v in violations)


def test_service_flow_profile_transport_not_allowed(tmp_path):
    import json

    import yaml

    runtime_topology = {
        "deployment_profiles": {"p": {"allowed_transports": ["gcs"]}},
        "storage_systems": {},
        "services": {},
        "service_flows": [
            {
                "producer": "svc-a",
                "consumer": "svc-b",
                "modes": {"live": {"p": {"transport": "kafka"}}},
            }
        ],
        "api_interactions": [],
        "storage_flows": [],
    }
    workspace_manifest = {
        "repositories": {"svc-a": {"type": "service"}, "svc-b": {"type": "service"}}
    }
    runtime_path = tmp_path / "rt.yaml"
    manifest_path = tmp_path / "wm.json"
    runtime_path.write_text(yaml.safe_dump(runtime_topology))
    manifest_path.write_text(json.dumps(workspace_manifest))
    violations = validate_runtime_topology(runtime_path, manifest_path)
    assert any("kafka" in v for v in violations)


def test_deployment_profiles_not_dict_treated_as_empty(tmp_path):
    """Line 87: deployment_profiles not a dict → treated as empty dict."""
    import json

    import yaml

    runtime_topology = {
        "deployment_profiles": "not-a-dict",
        "storage_systems": {"gcs": {}},
        "services": {},
        "service_flows": [],
        "api_interactions": [],
        "storage_flows": [{"actor": "unified-domain-client", "store": "gcs"}],
    }
    workspace_manifest = {"repositories": {}}
    runtime_path = tmp_path / "rt.yaml"
    manifest_path = tmp_path / "wm.json"
    runtime_path.write_text(yaml.safe_dump(runtime_topology))
    manifest_path.write_text(json.dumps(workspace_manifest))
    # Should not raise; deployment_profiles falls back to {}
    violations = validate_runtime_topology(runtime_path, manifest_path)
    # No profile violations, but missing sections may appear
    assert isinstance(violations, list)


def test_service_flow_mode_cfg_not_mapping(tmp_path):
    """Lines 123-124: mode_cfg value is not a dict."""
    import json

    import yaml

    runtime_topology = {
        "deployment_profiles": {"p": {"allowed_transports": ["gcs"]}},
        "storage_systems": {},
        "services": {},
        "service_flows": [
            {"producer": "svc-a", "consumer": "svc-b", "modes": {"live": {"p": "not-a-dict"}}}
        ],
        "api_interactions": [],
        "storage_flows": [],
    }
    workspace_manifest = {
        "repositories": {"svc-a": {"type": "service"}, "svc-b": {"type": "service"}}
    }
    runtime_path = tmp_path / "rt.yaml"
    manifest_path = tmp_path / "wm.json"
    runtime_path.write_text(yaml.safe_dump(runtime_topology))
    manifest_path.write_text(json.dumps(workspace_manifest))
    violations = validate_runtime_topology(runtime_path, manifest_path)
    assert any("mapping" in v for v in violations)


def test_api_interaction_unknown_caller_and_callee(tmp_path):
    """Lines 163, 165: caller and callee not in entities."""
    import json

    import yaml

    runtime_topology = {
        "deployment_profiles": {},
        "storage_systems": {},
        "services": {},
        "service_flows": [],
        "api_interactions": [{"caller": "unknown-caller", "callee": "unknown-callee"}],
        "storage_flows": [],
    }
    workspace_manifest = {"repositories": {}}
    runtime_path = tmp_path / "rt.yaml"
    manifest_path = tmp_path / "wm.json"
    runtime_path.write_text(yaml.safe_dump(runtime_topology))
    manifest_path.write_text(json.dumps(workspace_manifest))
    violations = validate_runtime_topology(runtime_path, manifest_path)
    assert any("unknown-caller" in v for v in violations)
    assert any("unknown-callee" in v for v in violations)
