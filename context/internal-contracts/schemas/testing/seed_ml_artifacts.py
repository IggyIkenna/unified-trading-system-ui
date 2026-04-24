"""ML artifact seeder — Phase 2.3.

Creates lightweight model artifacts for the dev project:
- Logistic regression model weights per strategy (JSON — no pickle/joblib dependency)
- Pre-fitted scaler parameters per feature service
- Artifacts versioned under gs://unified-trading-dev-models/v{version}/

No ML framework required at runtime — artifacts are stored as plain JSON and can be
loaded by the model registry's lightweight loader without scikit-learn on the critical path.

Usage:
    python seed_ml_artifacts.py --project unified-trading-dev --dry-run
    python seed_ml_artifacts.py --output /tmp/seed_models/ --version 1
"""

from __future__ import annotations

import argparse
import json
import logging
import math
import sys
from datetime import UTC, datetime
from pathlib import Path

import numpy as np

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Strategies and feature sets
# ---------------------------------------------------------------------------

STRATEGIES: list[dict[str, object]] = [
    {
        "name": "momentum_cefi",
        "asset_class": "crypto_cefi",
        "features": [
            "return_1",
            "return_5",
            "rsi_14",
            "realised_vol_20",
            "bb_bandwidth",
            "is_us_market_hours",
        ],
        "n_classes": 3,  # long / flat / short
        "description": "Momentum signal for CeFi crypto — logistic regression on return/RSI/vol features",
    },
    {
        "name": "mean_revert_tradfi",
        "asset_class": "tradfi_equity",
        "features": [
            "return_1",
            "rsi_14",
            "bb_bandwidth",
            "realised_vol_20",
            "day_of_week",
            "is_us_market_hours",
        ],
        "n_classes": 3,
        "description": "Mean reversion signal for TradFi equities",
    },
    {
        "name": "defi_yield_arb",
        "asset_class": "crypto_defi",
        "features": ["apy", "tvl_usd", "return_1"],
        "n_classes": 2,  # enter / exit
        "description": "Yield arbitrage signal for DeFi protocols",
    },
    {
        "name": "sports_value_bet",
        "asset_class": "sports",
        "features": ["odds_home", "odds_draw", "odds_away", "implied_prob_home"],
        "n_classes": 2,  # value / no-value
        "description": "Value bet detection for sports markets",
    },
    {
        "name": "vol_regime",
        "asset_class": "crypto_cefi",
        "features": ["realised_vol_20", "realised_vol_5", "atr_14", "btc_eth_corr_20"],
        "n_classes": 2,  # high_vol / low_vol regime
        "description": "Volatility regime classifier — adapts position sizing",
    },
]

FEATURE_SERVICES: list[str] = [
    "features-delta-one",
    "features-volatility",
    "features-calendar",
    "features-onchain",
    "features-cross-instrument",
    "features-commodity",
    "features-multi-timeframe",
]

# ---------------------------------------------------------------------------
# Artifact generators
# ---------------------------------------------------------------------------


def _softmax(logits: list[float]) -> list[float]:
    """Numerically stable softmax."""
    max_l = max(logits)
    exps = [math.exp(x - max_l) for x in logits]
    total = sum(exps)
    return [e / total for e in exps]


def _sigmoid(x: float) -> float:
    return 1.0 / (1.0 + math.exp(-x))


def generate_logistic_model(
    strategy: dict[str, object], rng: np.random.Generator
) -> dict[str, object]:
    """Generate a lightweight logistic regression artifact (JSON-serializable)."""
    features: list[str] = list(strategy["features"])  # type: ignore[arg-type]
    n_features = len(features)
    n_classes = int(strategy["n_classes"])  # type: ignore[arg-type]
    name = str(strategy["name"])

    # Random but bounded weights — small values so inference is stable
    weights = rng.standard_normal((n_classes, n_features)) * 0.1
    biases = rng.standard_normal(n_classes) * 0.05

    # Bias toward flat/no-trade to be conservative in dev
    if n_classes == 3:
        biases[1] += 0.5  # flat class

    return {
        "model_type": "logistic_regression",
        "strategy": name,
        "asset_class": str(strategy["asset_class"]),
        "description": str(strategy["description"]),
        "feature_names": features,
        "n_classes": n_classes,
        "class_labels": ["long", "flat", "short"][:n_classes]
        if n_classes == 3
        else ["enter", "exit"],
        "weights": weights.tolist(),
        "biases": biases.tolist(),
        "schema_version": "1.0",
        "is_dev_artifact": True,
        "note": "Lightweight random-weight model for dev/test — NOT for production trading",
        "created_at": datetime.now(UTC).isoformat(),
        "training_data": "synthetic_seed_v1",
        "performance": {
            "dev_accuracy": round(0.45 + 0.1 * float(rng.random()), 3),
            "note": "Random weights — accuracy near chance level by design",
        },
    }


def generate_scaler(service_name: str, rng: np.random.Generator) -> dict[str, object]:
    """Generate a StandardScaler artifact (mean/std per feature — JSON-serializable)."""
    # Realistic feature scales per service
    scales: dict[str, tuple[float, float]] = {
        "features-delta-one": (0.0, 0.02),  # returns: mean~0, std~2%
        "features-volatility": (0.5, 0.3),  # vol: mean~50%, std~30%
        "features-calendar": (11.5, 6.9),  # hours: uniform 0-23
        "features-onchain": (0.5, 0.2),
        "features-cross-instrument": (0.85, 0.1),  # correlation
        "features-commodity": (1.0, 0.5),
        "features-multi-timeframe": (0.0, 0.05),
    }
    mean_scale, std_scale = scales.get(service_name, (0.0, 1.0))
    n_features = 10
    means = (rng.standard_normal(n_features) * std_scale + mean_scale).tolist()
    stds = (np.abs(rng.standard_normal(n_features)) * std_scale + 0.1).tolist()

    return {
        "scaler_type": "standard",
        "feature_service": service_name,
        "n_features": n_features,
        "means": means,
        "stds": stds,
        "schema_version": "1.0",
        "is_dev_artifact": True,
        "created_at": datetime.now(UTC).isoformat(),
    }


def generate_model_registry_index(
    strategies: list[dict[str, object]],
    version: str,
    output_dir: Path,
) -> dict[str, object]:
    """Generate a model registry index JSON for the dev project."""
    return {
        "schema_version": "1.0",
        "model_version": version,
        "generated_at": datetime.now(UTC).isoformat(),
        "is_dev_artifact": True,
        "models": [
            {
                "strategy": str(s["name"]),
                "asset_class": str(s["asset_class"]),
                "artifact_path": str(output_dir / version / f"{s['name']}_model.json"),
            }
            for s in strategies
        ],
        "scalers": [
            {
                "feature_service": svc,
                "artifact_path": str(output_dir / version / "scalers" / f"{svc}_scaler.json"),
            }
            for svc in FEATURE_SERVICES
        ],
    }


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def run(output_dir: Path, version: str, project: str | None, dry_run: bool) -> int:
    """Generate and write all ML artifacts."""
    rng = np.random.default_rng(42)
    version_dir = output_dir / version
    scalers_dir = version_dir / "scalers"

    if not dry_run:
        version_dir.mkdir(parents=True, exist_ok=True)
        scalers_dir.mkdir(parents=True, exist_ok=True)

    # Model artifacts
    for strategy in STRATEGIES:
        artifact = generate_logistic_model(strategy, rng)
        out_path = version_dir / f"{strategy['name']}_model.json"
        if dry_run:
            log.info("[DRY RUN] Would write model: %s", out_path)
        else:
            out_path.write_text(json.dumps(artifact, indent=2))
            log.info("Wrote model artifact → %s", out_path)

    # Scaler artifacts
    for service_name in FEATURE_SERVICES:
        scaler = generate_scaler(service_name, rng)
        out_path = scalers_dir / f"{service_name}_scaler.json"
        if dry_run:
            log.info("[DRY RUN] Would write scaler: %s", out_path)
        else:
            out_path.write_text(json.dumps(scaler, indent=2))
            log.info("Wrote scaler artifact → %s", out_path)

    # Registry index
    registry = generate_model_registry_index(STRATEGIES, version, output_dir)
    registry_path = version_dir / "registry_index.json"
    if dry_run:
        log.info("[DRY RUN] Would write registry index: %s", registry_path)
    else:
        registry_path.write_text(json.dumps(registry, indent=2))
        log.info("Wrote registry index → %s", registry_path)

    # GCS hint
    if project:
        gcs_path = f"gs://{project}-models/v{version}/"
        if dry_run:
            log.info("[DRY RUN] Would upload: gsutil -m cp -r %s %s", version_dir, gcs_path)
        else:
            log.info("To upload artifacts: gsutil -m cp -r %s %s", version_dir, gcs_path)

    log.info(
        "ML artifact seeding complete: %d models, %d scalers, version=%s",
        len(STRATEGIES),
        len(FEATURE_SERVICES),
        version,
    )
    return 0


def _parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Seed lightweight ML model artifacts for the unified-trading dev project."
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("/tmp/seed_models"),  # nosec B108 — CLI default for dev seeding tool
        help="Local output directory for model artifacts",
    )
    parser.add_argument(
        "--version",
        type=str,
        default="1",
        help="Model version string (e.g. '1', '2')",
    )
    parser.add_argument("--project", type=str, default=None, help="GCP project name")
    parser.add_argument("--dry-run", action="store_true")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = _parse_args(argv if argv is not None else sys.argv[1:])
    return run(
        output_dir=args.output,
        version=args.version,
        project=args.project,
        dry_run=args.dry_run,
    )


if __name__ == "__main__":
    sys.exit(main())
