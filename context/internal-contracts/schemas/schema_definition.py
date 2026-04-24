"""
Schema Definition Models for GCS Parquet Output Validation

Owned by unified-internal-contracts (UIC). unified-trading-library (UTL) imports
from here — NOT the other way around. This keeps UIC free of UTL as a dependency
and resolves the circular dep risk (UTL already depends on UIC).

These are pure Python dataclasses with no pyarrow dependency. Pyarrow conversion
methods (get_pyarrow_schema, to_pyarrow_field) live in UTL's parquet infrastructure
since pyarrow has no type stubs and UTL is the parquet write layer.

Usage: import ColumnSchema and SchemaDefinition from unified_internal_contracts.schema_definition.

Example::

    schema = SchemaDefinition(
        name="instruments",
        columns=[
            ColumnSchema(name="instrument_key", dtype="string", nullable=False),
            ColumnSchema(
                name="tardis_exchange",
                dtype="string",
                nullable=True,
                nullable_overrides={"CEFI": False},
            ),
        ],
        dimension_keys=["category", "venue"],
    )

    is_nullable = schema.is_nullable("tardis_exchange", {"category": "CEFI"})  # False
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Required, TypedDict


class _RawColumn(TypedDict, total=False):
    name: Required[str]
    dtype: Required[str]
    nullable: bool
    nullable_overrides: dict[str, bool]
    partition_key: bool
    cluster_key: bool
    description: str
    applies_to: list[str] | None


class _RawSchema(TypedDict, total=False):
    name: Required[str]
    columns: list[_RawColumn]
    partitions: list[str]
    dimension_keys: list[str]
    version: str
    description: str


@dataclass
class ColumnSchema:
    """
    Schema definition for a single column.

    Attributes:
        name: Column name
        dtype: Data type string (e.g., "string", "float64", "int64", "datetime64[ns]", "bool")
        nullable: Default nullability (True = nullable, False = required)
        nullable_overrides: Dict mapping dimension values to override nullability.
            e.g., {"CEFI": False} means non-nullable for CEFI.
            Keys can be simple dimension values or compound keys like "CEFI:BINANCE-FUTURES".
        description: Human-readable description of the column
        applies_to: Optional set of dimension values where this column applies.
            If None, column applies to all dimensions.
    """

    name: str
    dtype: str
    nullable: bool = True
    nullable_overrides: dict[str, bool] = field(default_factory=dict)
    description: str = ""
    applies_to: set[str] | None = None


@dataclass
class SchemaDefinition:
    """
    Complete schema definition for a service's GCS parquet output.

    Supports dimension-aware nullability where different dimensions (category, venue,
    data_type) can have different nullability rules for the same column.

    Attributes:
        name: Schema name (e.g., "instruments", "features_delta_one")
        columns: List of column schemas
        dimension_keys: List of dimension keys used for nullability resolution
        version: Schema version string
        description: Human-readable schema description
    """

    name: str
    columns: list[ColumnSchema]
    dimension_keys: list[str] = field(default_factory=list)
    version: str = "1.0"
    description: str = ""
    _column_map: dict[str, ColumnSchema] = field(init=False, repr=False, compare=False)

    def __post_init__(self) -> None:
        """Build column lookup for fast access."""
        self._column_map = {col.name: col for col in self.columns}

    def get_column(self, name: str) -> ColumnSchema | None:
        """Get column schema by name."""
        return self._column_map.get(name)

    def is_nullable(self, column_name: str, dimensions: dict[str, str]) -> bool:
        """
        Determine if a column is nullable given the current dimensions.

        Resolution order (first match wins):
        1. Compound key (e.g., "CEFI:BINANCE-FUTURES:trades")
        2. Each dimension value individually (e.g., "CEFI", "BINANCE-FUTURES")
        3. Column's default nullable value
        """
        col = self._column_map.get(column_name)
        if col is None:
            return True

        dim_values = [dimensions.get(key, "") for key in self.dimension_keys if dimensions.get(key)]
        compound_key = ":".join(dim_values)

        if compound_key and compound_key in col.nullable_overrides:
            return col.nullable_overrides[compound_key]

        for key in self.dimension_keys:
            dim_value = dimensions.get(key)
            if dim_value and dim_value in col.nullable_overrides:
                return col.nullable_overrides[dim_value]

        return col.nullable

    def get_applicable_columns(self, dimensions: dict[str, str]) -> list[ColumnSchema]:
        """Get columns that apply to the given dimensions."""
        dim_values = set(dimensions.values())
        return [
            col
            for col in self.columns
            if col.applies_to is None or bool(col.applies_to & dim_values)
        ]

    def get_required_columns(self, dimensions: dict[str, str]) -> list[str]:
        """Get list of required (non-nullable) column names for given dimensions."""
        return [
            col.name
            for col in self.get_applicable_columns(dimensions)
            if not self.is_nullable(col.name, dimensions)
        ]

    def get_nullable_columns(self, dimensions: dict[str, str]) -> list[str]:
        """Get list of nullable column names for given dimensions."""
        return [
            col.name
            for col in self.get_applicable_columns(dimensions)
            if self.is_nullable(col.name, dimensions)
        ]

    def get_column_dtypes(self) -> dict[str, str]:
        """Get dict mapping column names to dtype strings."""
        return {col.name: col.dtype for col in self.columns}

    def to_dict(self) -> _RawSchema:
        """Convert schema definition to dictionary for serialization."""
        return _RawSchema(
            name=self.name,
            version=self.version,
            description=self.description,
            dimension_keys=self.dimension_keys,
            columns=[
                _RawColumn(
                    name=col.name,
                    dtype=col.dtype,
                    nullable=col.nullable,
                    nullable_overrides=col.nullable_overrides,
                    description=col.description,
                    applies_to=list(col.applies_to) if col.applies_to else None,
                )
                for col in self.columns
            ],
        )

    @classmethod
    def from_dict(cls, data: _RawSchema) -> SchemaDefinition:
        """Create schema definition from dictionary."""
        raw_columns: list[_RawColumn] = data.get("columns") or []
        columns = [
            ColumnSchema(
                name=col["name"],
                dtype=col["dtype"],
                nullable=bool(col.get("nullable", True)),
                nullable_overrides=dict(col.get("nullable_overrides") or {}),
                description=str(col.get("description") or ""),
                applies_to={str(x) for x in col.get("applies_to") or []}
                if col.get("applies_to")
                else None,
            )
            for col in raw_columns
        ]
        raw_dim_keys: list[str] = data.get("dimension_keys") or []
        return cls(
            name=data["name"],
            columns=columns,
            dimension_keys=raw_dim_keys,
            version=str(data.get("version") or "1.0"),
            description=str(data.get("description") or ""),
        )


@dataclass
class SchemaValidationError:
    """Details about a schema validation error."""

    column: str
    error_type: str
    message: str
    count: int = 0
    dimensions: dict[str, str] = field(default_factory=dict)

    def __str__(self) -> str:
        return self.message


@dataclass
class SchemaValidationResult:
    """Result of schema validation."""

    valid: bool
    errors: list[SchemaValidationError] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    stats: dict[str, object] = field(default_factory=dict)
    schema_name: str = ""
    dimensions: dict[str, str] = field(default_factory=dict)

    def add_error(self, column: str, error_type: str, message: str, count: int = 0) -> None:
        """Add an error to the result."""
        self.valid = False
        self.errors.append(
            SchemaValidationError(
                column=column,
                error_type=error_type,
                message=message,
                count=count,
                dimensions=self.dimensions.copy(),
            )
        )

    def add_warning(self, message: str) -> None:
        """Add a warning to the result."""
        self.warnings.append(message)

    def get_error_summary(self) -> str:
        """Get a summary of all errors."""
        if not self.errors:
            return "No errors"
        lines = [f"Schema validation failed for {self.schema_name}:"]
        lines.extend(f"  - {err.message}" for err in self.errors)
        return "\n".join(lines)


__all__ = [
    "ColumnSchema",
    "SchemaDefinition",
    "SchemaValidationError",
    "SchemaValidationResult",
]
