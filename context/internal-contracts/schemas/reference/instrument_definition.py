"""Canonical InstrumentDefinition for GCS/parquet instrument records.

SSOT for instrument definitions — instruments-service and market-tick-data-service
import from here. String-heavy schema for GCS/parquet compatibility.
"""

from __future__ import annotations

import re
from typing import ClassVar

from pydantic import BaseModel, field_validator, model_validator

_YYMMDD_RE = re.compile(r"(\d{6})(?:@|\\-|$)")
_ISO_RE = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}")
_OPTION_LONG_RE = re.compile(
    r"[-_](\d{6})[-_]([0-9]+(?:\.[0-9]+)?)[-_](CALL|PUT|C|P)(?:@|$)",
    re.IGNORECASE,
)
_OPTION_SHORT_RE = re.compile(
    r"[-_]\d{2}[A-Z]{3}\d{2}[-_]([0-9]+(?:\.[0-9]+)?)[-_](CALL|PUT|C|P)(?:@|$)",
    re.IGNORECASE,
)


def _parse_yymmdd(s: str) -> str | None:
    try:
        yy = int(s[:2])
        mm = int(s[2:4])
        dd = int(s[4:6])
        if not (1 <= mm <= 12) or not (1 <= dd <= 31):
            return None
        year = 2000 + yy if yy < 50 else 1900 + 100 + yy
        return f"{year:04d}-{mm:02d}-{dd:02d}T08:00:00Z"
    except (ValueError, IndexError):
        return None


def _validate_iso(value: str) -> bool:
    return bool(_ISO_RE.match(value.strip()))


class InstrumentDefinition(BaseModel):
    REQUIRED_BUSINESS_FIELDS: ClassVar[list[str]] = [
        "base_asset",
        "quote_asset",
        "tardis_symbol",
        "tardis_exchange",
        "data_types",
        "available_from_datetime",
    ]

    instrument_key: str
    venue: str
    instrument_type: str
    symbol: str
    available_from_datetime: str

    available_to_datetime: str | None = None
    data_types: str | None = None
    expiry: str | None = None
    option_type: str | None = None
    strike: str | None = None

    base_asset: str = ""
    quote_asset: str = ""
    settle_asset: str = ""
    underlying: str = ""
    inverse: bool = False

    tick_size: str = ""
    min_size: str = ""
    contract_size: float | None = None

    tardis_exchange: str = ""
    tardis_symbol: str = ""
    ccxt_exchange: str = ""
    ccxt_symbol: str = ""
    exchange_raw_symbol: str = ""
    databento_symbol: str = ""

    data_provider: str = ""
    venue_type: str = ""
    asset_class: str = ""
    market_category: str = ""
    chain: str = ""

    market_type: str = ""
    multiplier: str = ""
    listing: str = ""

    @field_validator("instrument_key", mode="before")
    @classmethod
    def validate_instrument_key(cls, v: object) -> str:
        s = str(v).strip() if v is not None else ""
        if not s:
            raise ValueError("instrument_key is required")
        parts = s.split(":")
        if len(parts) < 3:
            raise ValueError(f"Invalid instrument key format: {s!r}")
        return s

    @field_validator("available_from_datetime", mode="before")
    @classmethod
    def validate_from_datetime(cls, v: object) -> str:
        s = str(v).strip() if v is not None else ""
        if not s:
            raise ValueError("available_from_datetime is required")
        if not _validate_iso(s):
            raise ValueError(f"Invalid ISO datetime: {s!r}")
        return s

    @field_validator("available_to_datetime", mode="before")
    @classmethod
    def validate_to_datetime(cls, v: object) -> str | None:
        if v is None:
            return None
        s = str(v).strip()
        if not s:
            return None
        if not _validate_iso(s):
            raise ValueError(f"Invalid ISO datetime: {s!r}")
        return s

    @field_validator("data_types", mode="before")
    @classmethod
    def validate_data_types(cls, v: object) -> str | None:
        if v is None:
            return None
        s = str(v).strip()
        if s == "":
            raise ValueError("Data types cannot be empty string; use None to omit")
        return s

    @field_validator("expiry", mode="before")
    @classmethod
    def validate_expiry(cls, v: object) -> str | None:
        if v is None:
            return None
        s = str(v).strip()
        if not s:
            return None
        if not _validate_iso(s):
            raise ValueError(f"Invalid expiry: {s!r}")
        return s

    @field_validator("option_type", mode="before")
    @classmethod
    def validate_option_type(cls, v: object) -> str | None:
        if v is None:
            return None
        s = str(v).strip().upper()
        if not s:
            return None
        if s not in ("CALL", "PUT", "C", "P"):
            raise ValueError(f"Invalid option type: {v!r}")
        return "CALL" if s in ("CALL", "C") else "PUT"

    @field_validator("contract_size", mode="before")
    @classmethod
    def validate_contract_size(cls, v: object) -> float | None:
        if v is None:
            return None
        s = str(v).strip() if not isinstance(v, (int, float)) else str(v)
        if not s:
            return None
        try:
            return float(s)
        except ValueError as err:
            raise ValueError(f"Invalid contract_size: {v!r}") from err

    @model_validator(mode="after")
    def _auto_extract_fields(self) -> InstrumentDefinition:
        key = self.instrument_key
        inst_type = self.instrument_type.upper()
        if inst_type in ("FUTURE", "OPTION") and not self.expiry:
            self.expiry = self._extract_expiry_from_key(key)
        if inst_type == "OPTION" and (not self.strike or not self.option_type):
            strike, opt_type = self._extract_option_info(key, self.symbol)
            if not self.strike and strike:
                self.strike = strike
            if not self.option_type and opt_type:
                self.option_type = opt_type
        return self

    def _extract_expiry_from_key(self, key: str) -> str | None:
        symbol_part = key.split(":")[-1] if ":" in key else key
        m = _YYMMDD_RE.search(symbol_part)
        if m:
            return _parse_yymmdd(m.group(1))
        short_month = re.search(r"(\d{2})([A-Z]{3})(\d{2})", symbol_part)
        if short_month:
            month_map = {
                "JAN": 1,
                "FEB": 2,
                "MAR": 3,
                "APR": 4,
                "MAY": 5,
                "JUN": 6,
                "JUL": 7,
                "AUG": 8,
                "SEP": 9,
                "OCT": 10,
                "NOV": 11,
                "DEC": 12,
            }
            dd = int(short_month.group(1))
            mon = month_map.get(short_month.group(2).upper())
            yy = int(short_month.group(3))
            if mon:
                year = 2000 + yy if yy < 50 else 1950 + yy
                return f"{year:04d}-{mon:02d}-{dd:02d}T08:00:00Z"
        return None

    def _extract_option_info(self, key: str, symbol: str) -> tuple[str | None, str | None]:
        for source in (key, symbol):
            m = _OPTION_LONG_RE.search(source)
            if m:
                raw_opt = m.group(3).upper()
                opt = "CALL" if raw_opt in ("CALL", "C") else "PUT"
                return m.group(2), opt
            m = _OPTION_SHORT_RE.search(source)
            if m:
                raw_opt = m.group(2).upper()
                opt = "CALL" if raw_opt in ("CALL", "C") else "PUT"
                return m.group(1), opt
        return None, None

    def to_dict(self) -> dict[str, object]:
        return self.model_dump()

    @classmethod
    def from_dict(cls, data: dict[str, str | float | bool | int | None]) -> InstrumentDefinition:
        return cls.model_validate(data)

    def validate_required_fields(self) -> list[str]:
        missing: list[str] = []
        for field in self.REQUIRED_BUSINESS_FIELDS:
            val = getattr(self, field, None)
            if not val:
                missing.append(field)
        return missing
