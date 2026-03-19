#!/usr/bin/env python3
"""
Check Import Patterns - Enforce top-level imports for external dependencies

This script checks Python files for violations of the external import standards.
It ensures that imports from unified libraries use top-level imports only.

Usage:
    python check-import-patterns.py           # Check all files
    python check-import-patterns.py --verbose # Show detailed output
    python check-import-patterns.py --fix     # Auto-fix violations
    python check-import-patterns.py src/      # Check specific directory
"""

import argparse
import ast
import os
import re
import sys
from pathlib import Path
from typing import List, Tuple, Optional, Set

# External packages that should only use top-level imports
EXTERNAL_PACKAGES = {
    'unified_config_interface',
    'unified_config_service',
    'unified_events_interface',
    'unified_domain_services',
    'unified_cloud_services',
    'unified_market_interface',
    'unified_trade_execution_interface',
    'unified_ml_interface',
    'unified_defi_execution_interface',
    'execution_algo_library',
    'matching_engine_library',
}

# Patterns for detecting deep imports
DEEP_IMPORT_PATTERN = re.compile(
    r'^from\s+(' + '|'.join(EXTERNAL_PACKAGES) + r')\.(\w+(?:\.\w+)*)\s+import'
)

# Pattern for from imports
FROM_IMPORT_PATTERN = re.compile(
    r'^(\s*)from\s+([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)\s+import\s+(.+)$'
)


class ImportViolation:
    """Represents an import pattern violation."""

    def __init__(self, file_path: str, line_no: int, original: str,
                 package: str, module_path: str, imports: str):
        self.file_path = file_path
        self.line_no = line_no
        self.original = original
        self.package = package
        self.module_path = module_path
        self.imports = imports

    def get_fixed_import(self) -> str:
        """Generate the corrected import statement."""
        # Extract indentation from original
        indent = re.match(r'^(\s*)', self.original).group(1)
        return f"{indent}from {self.package} import {self.imports}"

    def __str__(self) -> str:
        return (f"{self.file_path}:{self.line_no}: "
                f"Deep import from {self.package}.{self.module_path}")


class ImportChecker:
    """Checks and fixes import patterns in Python files."""

    def __init__(self, verbose: bool = False):
        self.verbose = verbose
        self.violations: List[ImportViolation] = []
        self.files_checked = 0
        self.files_with_violations = set()

    def check_file(self, file_path: Path) -> List[ImportViolation]:
        """Check a single file for import violations."""
        violations = []

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()

            for line_no, line in enumerate(lines, 1):
                match = DEEP_IMPORT_PATTERN.match(line.strip())
                if match:
                    package = match.group(1)
                    module_path = match.group(2)

                    # Extract what's being imported
                    import_match = FROM_IMPORT_PATTERN.match(line)
                    if import_match:
                        imports = import_match.group(3)
                        violation = ImportViolation(
                            str(file_path), line_no, line.rstrip(),
                            package, module_path, imports
                        )
                        violations.append(violation)

        except Exception as e:
            if self.verbose:
                print(f"Error checking {file_path}: {e}")

        return violations

    def check_directory(self, directory: Path) -> None:
        """Recursively check all Python files in a directory."""
        for file_path in directory.rglob('*.py'):
            # Skip certain directories
            if any(part in file_path.parts for part in
                   ['.venv', 'venv', '__pycache__', '.git', 'node_modules']):
                continue

            self.files_checked += 1
            file_violations = self.check_file(file_path)

            if file_violations:
                self.violations.extend(file_violations)
                self.files_with_violations.add(str(file_path))

    def fix_file(self, file_path: str, violations: List[ImportViolation]) -> bool:
        """Fix violations in a file."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()

            # Sort violations by line number in reverse to avoid offset issues
            sorted_violations = sorted(violations, key=lambda v: v.line_no, reverse=True)

            for violation in sorted_violations:
                # Replace the line with fixed import
                lines[violation.line_no - 1] = violation.get_fixed_import() + '\n'

            with open(file_path, 'w', encoding='utf-8') as f:
                f.writelines(lines)

            return True

        except Exception as e:
            print(f"Error fixing {file_path}: {e}")
            return False

    def fix_violations(self) -> int:
        """Fix all found violations."""
        if not self.violations:
            return 0

        # Group violations by file
        violations_by_file = {}
        for violation in self.violations:
            if violation.file_path not in violations_by_file:
                violations_by_file[violation.file_path] = []
            violations_by_file[violation.file_path].append(violation)

        fixed_count = 0
        for file_path, file_violations in violations_by_file.items():
            if self.fix_file(file_path, file_violations):
                fixed_count += len(file_violations)
                print(f"Fixed {len(file_violations)} violations in {file_path}")

        return fixed_count

    def print_summary(self) -> None:
        """Print summary of findings."""
        print("\n" + "=" * 60)
        print("Import Pattern Check Summary")
        print("=" * 60)
        print(f"Files checked: {self.files_checked}")
        print(f"Files with violations: {len(self.files_with_violations)}")
        print(f"Total violations: {len(self.violations)}")

        if self.violations:
            print("\nViolations by package:")
            package_counts = {}
            for v in self.violations:
                package_counts[v.package] = package_counts.get(v.package, 0) + 1
            for package, count in sorted(package_counts.items()):
                print(f"  {package}: {count}")

    def print_violations(self) -> None:
        """Print detailed violation information."""
        if not self.violations:
            return

        print("\nDetailed Violations:")
        print("-" * 60)

        for violation in self.violations:
            print(f"\n{violation}")
            print(f"  Original: {violation.original}")
            print(f"  Fixed:    {violation.get_fixed_import()}")


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description='Check and fix import patterns for external dependencies'
    )
    parser.add_argument(
        'paths', nargs='*', default=['.'],
        help='Paths to check (default: current directory)'
    )
    parser.add_argument(
        '--fix', action='store_true',
        help='Automatically fix violations'
    )
    parser.add_argument(
        '--verbose', action='store_true',
        help='Show detailed output'
    )
    parser.add_argument(
        '--quiet', action='store_true',
        help='Only show errors'
    )

    args = parser.parse_args()

    checker = ImportChecker(verbose=args.verbose)

    # Check all specified paths
    for path in args.paths:
        path_obj = Path(path).resolve()
        if path_obj.is_file():
            if path_obj.suffix == '.py':
                checker.files_checked += 1
                violations = checker.check_file(path_obj)
                if violations:
                    checker.violations.extend(violations)
                    checker.files_with_violations.add(str(path_obj))
        elif path_obj.is_dir():
            checker.check_directory(path_obj)
        else:
            print(f"Warning: {path} is not a valid file or directory")

    # Handle output based on mode
    if args.fix:
        if checker.violations:
            fixed_count = checker.fix_violations()
            print(f"\n✅ Fixed {fixed_count} import violations")
            sys.exit(0)
        else:
            if not args.quiet:
                print("✅ No import pattern violations found")
            sys.exit(0)
    else:
        if args.verbose:
            checker.print_violations()

        if not args.quiet:
            checker.print_summary()

        if checker.violations:
            print("\n❌ Import pattern violations detected!")
            print("To fix automatically, run: python check-import-patterns.py --fix")
            sys.exit(1)
        else:
            if not args.quiet:
                print("\n✅ No import pattern violations found")
            sys.exit(0)


if __name__ == '__main__':
    main()
