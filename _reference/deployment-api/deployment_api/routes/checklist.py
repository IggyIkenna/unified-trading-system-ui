"""
Checklist API Routes

Endpoints for service production readiness checklists.

SSOT: unified-trading-codex/10-audit/repos/{repo}.yaml (schema v3.0)
      CR1-CR5 / DR1-DR6 / BR1-BR8 three-tier readiness model.

Checklist configs live in unified-trading-pm/configs/ (PM is the SSOT for all operational configs).
      Old phase_N_* schema files deleted 2026-03-11; codex v3.0 is the sole source of truth.
"""

import asyncio
import logging
from pathlib import Path
from typing import cast

import yaml
from fastapi import APIRouter, FastAPI, HTTPException, Request

logger = logging.getLogger(__name__)

router = APIRouter()

# ---------------------------------------------------------------------------
# Codex v3.0 schema helpers
# ---------------------------------------------------------------------------

_STATUS_MAP = {
    "pass": "done",
    "fail": "pending",
    "partial": "partial",
    "not_assessed": "pending",
    "na": "n/a",
}

_CR_STAGES: list[tuple[str, str]] = [
    ("cr1_functionality", "CR1 — Functionality"),
    ("cr2_unit_tests", "CR2 — Unit Tests"),
    ("cr3_integration_tests", "CR3 — Integration Tests"),
    ("cr4_quality_gate", "CR4 — Quality Gate"),
    ("cr5_quickmerge", "CR5 — Merged to Main"),
]

_DR_STAGES: list[tuple[str, str]] = [
    ("dr1_infra", "DR1 — Infrastructure"),
    ("dr2_ci_smoke", "DR2 — CI / Smoke"),
    ("dr3_feature_env", "DR3 — Feature Env Deployed"),
    ("dr4_sit_pass", "DR4 — SIT Pass"),
    ("dr5_load_perf", "DR5 — Load / Perf"),
    ("dr6_prod_ready", "DR6 — Prod Ready"),
]

_BR_STAGES: list[tuple[str, str]] = [
    ("br1_stakeholder_sign_off", "BR1 — Stakeholder Sign-off"),
    ("br2_circuit_breaker", "BR2 — Circuit Breaker Configured"),
    ("br3_alerting", "BR3 — Alerting Active"),
    ("br4_runbook", "BR4 — Runbook Written"),
    ("br5_revenue_path", "BR5 — Revenue-path Validated"),
    ("br6_batch_live_parity", "BR6 — Batch/Live Parity"),
    ("br7_compliance", "BR7 — Compliance / MiFID"),
    ("br8_user_approved", "BR8 — User Approved"),
]

# Stages whose explicit fail status is a hard-blocking issue
_BLOCKING_STAGES: set[str] = {
    "cr4_quality_gate",
    "cr5_quickmerge",
    "dr4_sit_pass",
    "dr5_load_perf",
    "dr6_prod_ready",
    "br8_user_approved",
}


def _ui_status(raw: str | None) -> str:
    return _STATUS_MAP.get(raw or "not_assessed", "pending")


def _parse_stage_item(
    stage_key: str,
    display_name: str,
    stage_data: object,
) -> dict[str, object] | None:
    if not isinstance(stage_data, dict):
        return None
    stage_dict = cast(dict[str, object], stage_data)
    raw_status = stage_dict.get("status")
    if not isinstance(raw_status, str):
        raw_status = "not_assessed"

    ui_status = _ui_status(raw_status)
    notes_raw = stage_dict.get("notes") or stage_dict.get("criteria") or ""
    notes = str(notes_raw)[:400] if notes_raw else ""
    is_blocking = stage_key in _BLOCKING_STAGES and raw_status == "fail"

    return {
        "id": stage_key,
        "description": display_name,
        "status": ui_status,
        "notes": notes,
        "verified_date": stage_dict.get("last_run_date") or stage_dict.get("evidence") or None,
        "blocking": is_blocking,
    }


def _build_category(
    name: str,
    display_name: str,
    stages: list[tuple[str, str]],
    section_data: dict[str, object],
) -> dict[str, object]:
    items: list[dict[str, object]] = []
    done: float = 0
    na_count = 0

    for stage_key, stage_display in stages:
        item = _parse_stage_item(stage_key, stage_display, section_data.get(stage_key))
        if item is None:
            continue
        items.append(item)
        if item["status"] == "done":
            done += 1
        elif item["status"] == "partial":
            done += 0.5
        elif item["status"] == "n/a":
            na_count += 1

    total = len(items)
    applicable = total - na_count
    percent = int(done / applicable * 100) if applicable > 0 else 100

    return {
        "name": name,
        "display_name": display_name,
        "percent": percent,
        "total_items": total,
        "completed_items": int(done),
        "items": items,
    }


def _parse_codex_checklist(data: dict[str, object]) -> dict[str, object]:
    """Parse a codex v3.0 YAML into the UI checklist response format."""
    service = str(data.get("repo", "unknown"))
    last_updated = str(data.get("last_updated", ""))  # noqa: qg-empty-fallback — YAML checklist deserialization default
    categories: list[dict[str, object]] = []
    all_items: list[dict[str, object]] = []

    cr_section = data.get("code_readiness")
    if isinstance(cr_section, dict):
        cr_dict = cast(dict[str, object], cr_section)
        cat = _build_category(
            "code_readiness", "Code Readiness (CR1\u2013CR5)", _CR_STAGES, cr_dict
        )
        categories.append(cat)
        all_items.extend(cast(list[dict[str, object]], cat["items"]))

    dr_section = data.get("deployment_readiness")
    if isinstance(dr_section, dict):
        dr_dict = cast(dict[str, object], dr_section)
        na_reason = dr_dict.get("na_reason")
        if na_reason:
            dr_na_cat: dict[str, object] = {
                "name": "deployment_readiness",
                "display_name": "Deployment Readiness",
                "percent": 100,
                "total_items": 1,
                "completed_items": 1,
                "items": [
                    {
                        "id": "dr_na",
                        "description": f"Deployment readiness N/A — {na_reason}",
                        "status": "n/a",
                        "notes": "",
                        "verified_date": None,
                        "blocking": False,
                    }
                ],
            }
            categories.append(dr_na_cat)
            all_items.extend(cast(list[dict[str, object]], dr_na_cat["items"]))
        else:
            for mode_key, mode_label in [("batch", "Batch"), ("live", "Live")]:
                mode_data = dr_dict.get(mode_key)
                if isinstance(mode_data, dict):
                    mode_dict = cast(dict[str, object], mode_data)
                    cat = _build_category(
                        f"deployment_readiness_{mode_key}",
                        f"Deployment Readiness \u2014 {mode_label} (DR1\u2013DR6)",
                        _DR_STAGES,
                        mode_dict,
                    )
                    categories.append(cat)
                    all_items.extend(cast(list[dict[str, object]], cat["items"]))

    br_section = data.get("business_readiness")
    if isinstance(br_section, dict):
        br_dict = cast(dict[str, object], br_section)
        cat = _build_category(
            "business_readiness",
            "Business Readiness (BR1\u2013BR8)",
            _BR_STAGES,
            br_dict,
        )
        categories.append(cat)
        all_items.extend(cast(list[dict[str, object]], cat["items"]))

    blocking_items: list[dict[str, object]] = []
    for item in all_items:
        if item.get("blocking") and item.get("status") in ("pending", "partial"):
            parent_cat = next(
                (c["display_name"] for c in categories if item in cast(list[object], c["items"])),
                "",
            )
            blocking_items.append(
                {
                    "id": item["id"],
                    "description": item["description"],
                    "category": parent_cat,
                    "notes": item.get("notes", ""),  # noqa: qg-empty-fallback — YAML checklist item deserialization default
                }
            )

    done_count = sum(1 for i in all_items if i.get("status") == "done")
    partial_count = sum(1 for i in all_items if i.get("status") == "partial")
    pending_count = sum(1 for i in all_items if i.get("status") == "pending")
    na_count_total = sum(1 for i in all_items if i.get("status") == "n/a")

    applicable = len(all_items) - na_count_total
    effective_done = done_count + partial_count * 0.5
    readiness_percent = int(effective_done / applicable * 100) if applicable > 0 else 100

    return {
        "service": service,
        "last_updated": last_updated,
        "schema": "codex-v3.0",
        "readiness_percent": readiness_percent,
        "total_items": len(all_items),
        "completed_items": done_count,
        "partial_items": partial_count,
        "pending_items": pending_count,
        "not_applicable_items": na_count_total,
        "categories": categories,
        "blocking_items": blocking_items,
    }


# ---------------------------------------------------------------------------
# Loader: codex v3.0 only (SSOT: unified-trading-codex/10-audit/repos/)
# ---------------------------------------------------------------------------


def _get_checklist_path(codex_dir: Path, service_name: str) -> Path:
    """Return the codex v3.0 YAML path for a service."""
    return codex_dir / f"{service_name}.yaml"


def _load_checklist_yaml(codex_dir: Path, service_name: str) -> dict[str, object]:
    """Load and return raw codex v3.0 YAML data for a service.

    Raises FileNotFoundError when the codex YAML does not exist.
    """
    path = _get_checklist_path(codex_dir, service_name)
    if not path.exists():
        raise FileNotFoundError(f"No readiness checklist found for service: {service_name}")
    with open(path) as f:
        return cast(dict[str, object], yaml.safe_load(f))


def _parse_checklist(data: dict[str, object]) -> dict[str, object]:
    """Parse codex v3.0 YAML data into the UI checklist response format.

    This is the primary entry point used by route handlers and tests.
    """
    return _parse_codex_checklist(data)


def _load_checklist(codex_dir: Path, service_name: str) -> dict[str, object]:
    """Load and parse the codex v3.0 checklist for a service."""
    data = _load_checklist_yaml(codex_dir, service_name)
    return _parse_codex_checklist(data)


def _list_all_checklists(codex_dir: Path) -> list[dict[str, object]]:
    """Return all available checklists from codex v3.0 SSOT."""
    results: list[dict[str, object]] = []

    if not codex_dir.exists():
        return results

    for yaml_file in sorted(codex_dir.glob("*.yaml")):
        if yaml_file.name.startswith("_"):
            continue
        service_name = yaml_file.stem
        try:
            parsed = _load_checklist(codex_dir, service_name)
            results.append(
                {
                    "service": service_name,
                    "readiness_percent": parsed["readiness_percent"],
                    "total_items": parsed["total_items"],
                    "completed_items": parsed["completed_items"],
                    "pending_items": parsed["pending_items"],
                    "blocking_count": len(cast(list[object], parsed["blocking_items"])),
                    "last_updated": parsed["last_updated"],
                    "schema": parsed.get("schema", "codex-v3.0"),
                }
            )
        except (OSError, ValueError, RuntimeError) as e:
            results.append({"service": service_name, "readiness_percent": 0, "error": str(e)})

    results.sort(key=lambda x: int(cast(int, x.get("readiness_percent") or 0)), reverse=True)
    return results


def _get_warnings(checklist: dict[str, object]) -> list[str]:
    warnings: list[str] = []
    categories = cast(list[dict[str, object]], checklist.get("categories") or [])
    for category in categories:
        items = cast(list[dict[str, object]], category.get("items") or [])
        for item in items:
            if item["status"] in ("pending", "partial") and not item.get("blocking", False):
                warnings.append(f"{item['description']} ({item['id']})")
    return warnings[:10]


# ---------------------------------------------------------------------------
# Route handlers
# ---------------------------------------------------------------------------


@router.get("/{service_name}/checklist")
async def get_service_checklist(service_name: str, request: Request) -> dict[str, object]:
    """
    Get production readiness checklist for a service.

    Reads from unified-trading-codex/10-audit/repos/{service}.yaml (v3.0 schema).
    """
    app = cast(FastAPI, request.app)
    codex_dir: Path | None = getattr(app.state, "codex_dir", None)
    if codex_dir is None:
        raise HTTPException(
            status_code=503,
            detail="Codex readiness directory unavailable. "
            "unified-trading-codex/10-audit/repos/ must be present alongside this service.",
        )

    def _load() -> dict[str, object]:
        return _load_checklist(codex_dir, service_name)

    try:
        return await asyncio.to_thread(_load)
    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail=f"No readiness checklist found for '{service_name}'. "
            f"Expected: codex/10-audit/repos/{service_name}.yaml",
        ) from None
    except (OSError, ValueError, RuntimeError) as e:
        logger.exception("Internal error in get_service_checklist")
        raise HTTPException(status_code=500, detail="Internal server error") from e


@router.get("/{service_name}/checklist/validate")
async def validate_service_checklist(service_name: str, request: Request) -> dict[str, object]:
    """
    Validate service readiness for deployment.

    Returns blocking items and overall readiness. Ready = no blocking items
    AND readiness >= 95% (threshold allows in-progress non-critical items).
    """
    app = cast(FastAPI, request.app)
    codex_dir: Path | None = getattr(app.state, "codex_dir", None)
    if codex_dir is None:
        return {
            "service": service_name,
            "ready": False,
            "readiness_percent": 0,
            "total_items": 0,
            "completed_items": 0,
            "blocking_items": [],
            "warnings": ["Codex readiness directory unavailable"],
            "can_proceed_with_acknowledgment": False,
        }

    def _validate() -> dict[str, object]:
        checklist = _load_checklist(codex_dir, service_name)
        blocking_items = cast(list[object], checklist.get("blocking_items") or [])
        readiness_pct_raw = checklist.get("readiness_percent", 0)
        readiness_percent = (
            int(readiness_pct_raw) if isinstance(readiness_pct_raw, (int, float)) else 0
        )
        warnings = _get_warnings(checklist)
        is_ready = len(blocking_items) == 0 and readiness_percent >= 95
        can_proceed = len(blocking_items) == 0

        return {
            "service": service_name,
            "ready": is_ready,
            "readiness_percent": readiness_percent,
            "total_items": checklist.get("total_items", 0),
            "completed_items": checklist.get("completed_items", 0),
            "blocking_items": blocking_items,
            "warnings": warnings,
            "can_proceed_with_acknowledgment": can_proceed,
        }

    try:
        return await asyncio.to_thread(_validate)
    except FileNotFoundError:
        return {
            "service": service_name,
            "ready": True,
            "readiness_percent": 0,
            "total_items": 0,
            "completed_items": 0,
            "blocking_items": [],
            "warnings": [f"No checklist found for {service_name}"],
            "can_proceed_with_acknowledgment": True,
        }
    except (OSError, ValueError, RuntimeError) as e:
        logger.exception("Internal error in validate_service_checklist")
        raise HTTPException(status_code=500, detail="Internal server error") from e


@router.get("")
async def list_checklists(request: Request) -> dict[str, object]:
    """
    List all available service checklists with summary status.

    Reads exclusively from codex v3.0 SSOT (unified-trading-codex/10-audit/repos/).
    """
    app = cast(FastAPI, request.app)
    codex_dir: Path | None = getattr(app.state, "codex_dir", None)
    if codex_dir is None:
        return {"checklists": [], "count": 0}

    def _list() -> list[dict[str, object]]:
        return _list_all_checklists(codex_dir)

    result = await asyncio.to_thread(_list)
    return {"checklists": result, "count": len(result)}
