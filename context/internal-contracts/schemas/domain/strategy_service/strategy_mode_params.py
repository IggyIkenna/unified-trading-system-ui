"""Per-strategy-mode parameter bag for grid/config resolution.

Mirrors TargetTypeParams pattern from domain/ml/schemas.py but scoped to
strategy execution modes. Used by StrategyGridConfig in unified-config-interface.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class StrategyModeParams(BaseModel, frozen=True):
    """Per-strategy-mode parameter bag for grid/config resolution.

    Known param sets by strategy_mode:
    - momentum: prediction_threshold (float), stop_loss_pct (float),
      take_profit_pct (float), max_position_size_usd (float)
    - mean_reversion: entry_z_score (float), exit_z_score (float),
      lookback_period (int)
    - value_betting: min_edge_pct (float), stake_sizing (str: 'kelly'/'fixed'/'fractional'),
      stake_amount (float), stake_pct (float)
    - stat_arb: cointegration_lookback (int), entry_zscore (float),
      exit_zscore (float), hedge_ratio_window (int)
    """

    strategy_mode: str
    params: dict[str, int | float | str | bool] = Field(default_factory=dict)
