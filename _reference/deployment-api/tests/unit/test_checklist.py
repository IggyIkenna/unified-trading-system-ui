"""
Unit tests for checklist module pure helper functions.

Tests cover:
- _get_checklist_path
- _parse_checklist  (codex v3.0 schema — legacy phase_N_* schema removed 2026-03-11)
- _get_warnings
- _load_checklist_yaml
"""

import tempfile
from pathlib import Path

import pytest
import yaml

from deployment_api.routes.checklist import (
    _get_checklist_path,
    _get_warnings,
    _load_checklist_yaml,
    _parse_checklist,
)


class TestGetChecklistPath:
    """Tests for _get_checklist_path."""

    def test_returns_correct_path(self):
        codex_dir = Path("/tmp/codex/repos")
        result = _get_checklist_path(codex_dir, "instruments-service")
        assert result == Path("/tmp/codex/repos/instruments-service.yaml")

    def test_different_service_names(self):
        codex_dir = Path("/app/codex/repos")
        result = _get_checklist_path(codex_dir, "market-data")
        assert result == Path("/app/codex/repos/market-data.yaml")


class TestParseChecklist:
    """Tests for _parse_checklist (codex v3.0 schema)."""

    def _make_codex_data(
        self,
        repo: str = "test-service",
        last_updated: str = "2026-01-01",
        cr_statuses: dict[str, str] | None = None,
    ) -> dict[str, object]:
        cr: dict[str, object] = {}
        for stage in [
            "cr1_functionality",
            "cr2_unit_tests",
            "cr3_integration_tests",
            "cr4_quality_gate",
            "cr5_quickmerge",
        ]:
            status = (cr_statuses or {}).get(stage, "pass")
            cr[stage] = {"status": status, "notes": ""}
        return {
            "repo": repo,
            "last_updated": last_updated,
            "schema_version": "3.0",
            "code_readiness": cr,
        }

    def test_empty_checklist(self):
        data: dict[str, object] = {"repo": "test-service", "last_updated": "2026-01-01"}
        result = _parse_checklist(data)
        assert result["service"] == "test-service"
        assert result["total_items"] == 0
        assert result["completed_items"] == 0
        assert result["readiness_percent"] == 100
        assert result["categories"] == []
        assert result["blocking_items"] == []

    def test_all_pass_items(self):
        data = self._make_codex_data()
        result = _parse_checklist(data)
        assert result["total_items"] == 5
        assert result["completed_items"] == 5
        assert result["readiness_percent"] == 100

    def test_pending_items(self):
        data = self._make_codex_data(
            cr_statuses={"cr1_functionality": "pass", "cr2_unit_tests": "fail"}
        )
        result = _parse_checklist(data)
        assert result["total_items"] == 5
        # cr2 is fail -> pending; remaining 4 are pass -> done
        assert result["pending_items"] >= 1
        assert result["readiness_percent"] < 100

    def test_partial_items_count_as_half(self):
        cr_statuses = dict.fromkeys(
            [
                "cr1_functionality",
                "cr2_unit_tests",
                "cr3_integration_tests",
                "cr4_quality_gate",
                "cr5_quickmerge",
            ],
            "partial",
        )
        data = self._make_codex_data(cr_statuses=cr_statuses)
        result = _parse_checklist(data)
        assert result["partial_items"] == 5
        # 5 partial = 2.5 effective done, 5 applicable => 50%
        assert result["readiness_percent"] == 50

    def test_na_items_excluded_from_percent(self):
        data: dict[str, object] = {
            "repo": "test-service",
            "last_updated": "2026-01-01",
            "schema_version": "3.0",
            "code_readiness": {
                "cr1_functionality": {"status": "pass", "notes": ""},
                "cr2_unit_tests": {"status": "na", "notes": ""},
            },
        }
        result = _parse_checklist(data)
        assert result["not_applicable_items"] == 1
        # Only 1 applicable item (cr1=pass), cr2=n/a excluded -> 100%
        assert result["readiness_percent"] == 100

    def test_blocking_items_tracked_on_fail(self):
        data: dict[str, object] = {
            "repo": "test-service",
            "last_updated": "2026-01-01",
            "schema_version": "3.0",
            "code_readiness": {
                "cr4_quality_gate": {"status": "fail", "notes": "QG failing"},
                "cr1_functionality": {"status": "pass", "notes": ""},
            },
        }
        result = _parse_checklist(data)
        # cr4_quality_gate is in _BLOCKING_STAGES and status=fail -> blocking
        assert len(result["blocking_items"]) == 1
        assert result["blocking_items"][0]["id"] == "cr4_quality_gate"

    def test_last_updated_passed_through(self):
        data = self._make_codex_data(last_updated="2026-03-04")
        result = _parse_checklist(data)
        assert result["last_updated"] == "2026-03-04"

    def test_unknown_repo_defaults(self):
        data: dict[str, object] = {}
        result = _parse_checklist(data)
        assert result["service"] == "unknown"

    def test_schema_field_is_codex_v3(self):
        data = self._make_codex_data()
        result = _parse_checklist(data)
        assert result["schema"] == "codex-v3.0"

    def test_deployment_readiness_batch_and_live(self):
        data: dict[str, object] = {
            "repo": "exec-service",
            "last_updated": "2026-01-01",
            "schema_version": "3.0",
            "deployment_readiness": {
                "batch": {"dr1_infra": {"status": "pass"}, "dr2_ci_smoke": {"status": "pass"}},
                "live": {"dr1_infra": {"status": "pass"}, "dr2_ci_smoke": {"status": "fail"}},
            },
        }
        result = _parse_checklist(data)
        category_names = [c["name"] for c in result["categories"]]
        assert "deployment_readiness_batch" in category_names
        assert "deployment_readiness_live" in category_names

    def test_deployment_readiness_na(self):
        data: dict[str, object] = {
            "repo": "my-library",
            "last_updated": "2026-01-01",
            "schema_version": "3.0",
            "deployment_readiness": {"na_reason": "library — no standalone deployment"},
        }
        result = _parse_checklist(data)
        assert result["not_applicable_items"] == 1
        assert result["categories"][0]["name"] == "deployment_readiness"

    def test_blocking_items_include_category_display_name(self):
        data: dict[str, object] = {
            "repo": "test-service",
            "last_updated": "2026-01-01",
            "schema_version": "3.0",
            "code_readiness": {
                "cr5_quickmerge": {"status": "fail", "notes": "Not merged yet"},
            },
        }
        result = _parse_checklist(data)
        assert result["blocking_items"][0]["category"] == "Code Readiness (CR1\u2013CR5)"


class TestGetWarnings:
    """Tests for _get_warnings."""

    def _make_checklist(self, items: dict[str, dict[str, object]]) -> dict[str, object]:
        """Build a parsed checklist dict with given items."""
        return {
            "categories": [
                {
                    "items": [
                        {
                            "id": k,
                            "description": v["description"],
                            "status": v["status"],
                            "blocking": v.get("blocking", False),
                        }
                        for k, v in items.items()
                    ]
                }
            ]
        }

    def test_pending_non_blocking_is_warning(self):
        checklist = self._make_checklist(
            {
                "item_a": {"status": "pending", "description": "Do this", "blocking": False},
            }
        )
        warnings = _get_warnings(checklist)
        assert len(warnings) == 1
        assert "Do this" in warnings[0]

    def test_partial_non_blocking_is_warning(self):
        checklist = self._make_checklist(
            {
                "item_a": {"status": "partial", "description": "Almost done", "blocking": False},
            }
        )
        warnings = _get_warnings(checklist)
        assert len(warnings) == 1

    def test_done_items_not_in_warnings(self):
        checklist = self._make_checklist(
            {
                "item_a": {"status": "done", "description": "Done", "blocking": False},
            }
        )
        warnings = _get_warnings(checklist)
        assert warnings == []

    def test_blocking_items_excluded_from_warnings(self):
        checklist = self._make_checklist(
            {
                "item_a": {"status": "pending", "description": "Blocking item", "blocking": True},
            }
        )
        warnings = _get_warnings(checklist)
        assert warnings == []

    def test_warnings_capped_at_10(self):
        items = {
            f"item_{i}": {"status": "pending", "description": f"Item {i}", "blocking": False}
            for i in range(15)
        }
        checklist = self._make_checklist(items)
        warnings = _get_warnings(checklist)
        assert len(warnings) == 10

    def test_empty_checklist(self):
        checklist: dict[str, object] = {"categories": []}
        warnings = _get_warnings(checklist)
        assert warnings == []


class TestLoadChecklistYaml:
    """Tests for _load_checklist_yaml."""

    def test_loads_valid_yaml(self):
        content = {
            "repo": "my-service",
            "last_updated": "2026-01-01",
            "schema_version": "3.0",
            "code_readiness": {
                "cr1_functionality": {"status": "pass", "notes": ""},
            },
        }
        with tempfile.TemporaryDirectory() as tmpdir:
            codex_dir = Path(tmpdir)
            checklist_path = codex_dir / "my-service.yaml"
            with open(checklist_path, "w") as f:
                yaml.dump(content, f)

            result = _load_checklist_yaml(codex_dir, "my-service")
            assert result["repo"] == "my-service"

    def test_raises_file_not_found_for_missing_service(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            codex_dir = Path(tmpdir)
            with pytest.raises(FileNotFoundError):
                _load_checklist_yaml(codex_dir, "nonexistent-service")
