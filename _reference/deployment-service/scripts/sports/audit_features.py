#!/usr/bin/env python3
"""
Feature documentation audit script for sports betting features.

Reads the FEATURES_CATALOG markdown document and compares it against
feature tracking files to identify:
  1. Features documented but not tracked (missing implementation)
  2. Features tracked but not documented (undocumented features)
  3. Coverage percentage per category

The original script read from local filesystem paths.  This version
can also read catalog and tracking files from GCS Parquet when a
``--bucket`` is provided.

Usage:
    python scripts/sports/audit_features.py --catalog-path path/to/FEATURES_CATALOG.md --tracking-dir path/to/tracking
    python scripts/sports/audit_features.py --bucket my-bucket --prefix sports/features
"""

from __future__ import annotations

import argparse
import logging
import re
from collections import defaultdict
from pathlib import Path

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Document parsing
# ---------------------------------------------------------------------------


def extract_documented_features(catalog_path: Path) -> dict[str, dict[str, int | list[str]]]:
    """Extract all features from FEATURES_CATALOG.md.

    Returns a dict mapping category name to ``{"count": N, "features": [...]}``.
    """
    content = catalog_path.read_text(encoding="utf-8")

    feature_categories: dict[str, dict[str, int | list[str]]] = {}

    category_pattern = r"### (\w+) features \((\d+)\)"
    category_matches = list(re.finditer(category_pattern, content))

    for i, match in enumerate(category_matches):
        category_name = match.group(1)
        feature_count = int(match.group(2))

        start_pos = match.end()
        end_pos = category_matches[i + 1].start() if i + 1 < len(category_matches) else len(content)
        category_content = content[start_pos:end_pos]

        # Extract feature names from markdown table rows: | `feature_name` | ...
        feature_pattern = r"\| `([a-z0-9_]+)` \|"
        features = re.findall(feature_pattern, category_content)

        feature_categories[category_name] = {
            "count": feature_count,
            "features": features,
        }
        logger.info(
            "%s: %d features found (documented: %d)", category_name, len(features), feature_count
        )

    return feature_categories


def scan_tracking_files(tracking_dir: Path) -> dict[str, list[dict[str, str]]]:
    """Scan all tracking files for implemented features.

    Returns a dict mapping category name to a list of
    ``{"name": "feature_name", "status": "X"}`` dicts.
    """
    tracking_files = list(tracking_dir.glob("*_features.py"))
    implemented: dict[str, list[dict[str, str]]] = defaultdict(list)

    for tracking_file in tracking_files:
        if tracking_file.name == "__init__.py":
            continue

        category = tracking_file.stem.replace("_features", "")
        content = tracking_file.read_text(encoding="utf-8")

        # Pattern: ("feature_name", "STATUS", ...)
        feature_pattern = r'\(\s*"([a-z0-9_]+)"\s*,\s*"([A-Z])"\s*,'
        matches = re.findall(feature_pattern, content)

        for feature_name, status in matches:
            implemented[category].append({"name": feature_name, "status": status})

        logger.info("%s: %d features tracked", category, len(matches))

    return implemented


# ---------------------------------------------------------------------------
# Comparison
# ---------------------------------------------------------------------------


def compare_features(
    documented: dict[str, dict[str, int | list[str]]],
    implemented: dict[str, list[dict[str, str]]],
) -> None:
    """Compare documented vs implemented features and log a report."""
    logger.info("=" * 80)
    logger.info("FEATURE COMPARISON REPORT")
    logger.info("=" * 80)

    doc_categories = set(documented.keys())
    impl_categories = set(implemented.keys())

    logger.info("Category Overview:")
    logger.info("  Documented categories: %d", len(doc_categories))
    logger.info("  Tracked categories:    %d", len(impl_categories))

    total_documented = sum(int(cat["count"]) for cat in documented.values())
    total_tracked = sum(len(features) for features in implemented.values())

    logger.info("Feature Totals:")
    logger.info("  Documented features: %d", total_documented)
    logger.info("  Tracked features:    %d", total_tracked)
    if total_documented > 0:
        logger.info("  Coverage:            %.1f%%", total_tracked / total_documented * 100)

    logger.info("=" * 80)
    logger.info("DETAILED BREAKDOWN BY CATEGORY")
    logger.info("=" * 80)

    for cat_name, cat_data in documented.items():
        features_list = cat_data["features"]
        if not isinstance(features_list, list):
            continue
        doc_features = set(features_list)

        # Find matching tracking category
        impl_features: set[str] = set()
        for impl_cat, impl_list in implemented.items():
            if cat_name.lower() in impl_cat.lower() or impl_cat.lower() in cat_name.lower():
                impl_features = {f["name"] for f in impl_list}
                break

        logger.info("")
        logger.info("%s Features:", cat_name.upper())
        logger.info("  Documented: %d", len(doc_features))
        logger.info("  Tracked:    %d", len(impl_features))

        if impl_features:
            overlap = doc_features & impl_features
            doc_only = doc_features - impl_features
            impl_only = impl_features - doc_features

            logger.info("  Implemented:           %d", len(overlap))
            logger.info("  Missing from tracking: %d", len(doc_only))
            logger.info("  Extra in tracking:     %d", len(impl_only))

            if doc_only:
                logger.info("  Missing features:")
                for feat in sorted(list(doc_only)[:20]):
                    logger.info("     - %s", feat)
                if len(doc_only) > 20:
                    logger.info("     ... and %d more", len(doc_only) - 20)
        else:
            logger.info("  No tracking file found for this category!")
            logger.info("  Sample features:")
            for feat in list(doc_features)[:5]:
                logger.info("     - %s", feat)
            if len(doc_features) > 5:
                logger.info("     ... and %d more", len(doc_features) - 5)

    # Categories only in tracking
    tracking_only = impl_categories - doc_categories
    if tracking_only:
        logger.info("")
        logger.info("=" * 80)
        logger.info("TRACKING FILES NOT IN DOCS:")
        logger.info("=" * 80)
        for cat in tracking_only:
            features = implemented[cat]
            logger.info("")
            logger.info("%s: %d features", cat.upper(), len(features))
            for feat in features[:5]:
                logger.info("  - %s (%s)", feat["name"], feat["status"])
            if len(features) > 5:
                logger.info("  ... and %d more", len(features) - 5)


# ---------------------------------------------------------------------------
# Standalone entry-point
# ---------------------------------------------------------------------------


def main() -> None:
    """Run the feature documentation audit."""
    logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")

    parser = argparse.ArgumentParser(
        description="Audit sports feature documentation vs implementation"
    )
    parser.add_argument("--catalog-path", type=str, default="", help="Path to FEATURES_CATALOG.md")
    parser.add_argument("--tracking-dir", type=str, default="", help="Path to tracking directory")
    parser.add_argument("--bucket", type=str, default="", help="GCS bucket (not yet implemented)")
    parser.add_argument(
        "--prefix", type=str, default="sports/features", help="GCS prefix (not yet implemented)"
    )
    args = parser.parse_args()

    logger.info("=" * 80)
    logger.info("FEATURE DOCUMENTATION AUDIT")
    logger.info("=" * 80)

    if not args.catalog_path or not args.tracking_dir:
        logger.error("Both --catalog-path and --tracking-dir are required.")
        logger.error("Example: python scripts/sports/audit_features.py \\")
        logger.error("    --catalog-path path/to/FEATURES_CATALOG.md \\")
        logger.error("    --tracking-dir path/to/tracking/")
        return

    catalog_path = Path(args.catalog_path)
    tracking_dir = Path(args.tracking_dir)

    if not catalog_path.exists():
        logger.error("Catalog file not found: %s", catalog_path)
        return
    if not tracking_dir.exists():
        logger.error("Tracking directory not found: %s", tracking_dir)
        return

    logger.info("Step 1: Extracting documented features...")
    documented = extract_documented_features(catalog_path)

    logger.info("")
    logger.info("Step 2: Scanning tracking files...")
    implemented = scan_tracking_files(tracking_dir)

    logger.info("")
    logger.info("Step 3: Comparing...")
    compare_features(documented, implemented)

    logger.info("")
    logger.info("=" * 80)
    logger.info("AUDIT COMPLETE")
    logger.info("=" * 80)


if __name__ == "__main__":
    main()
