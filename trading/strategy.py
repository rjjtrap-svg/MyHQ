"""SMA crossover signal logic — pure functions, no I/O.

Same rule the original manual backtest used: golden cross (fast SMA moves
above slow SMA) = buy, death cross (fast SMA moves below slow SMA) = sell.
"""
from dataclasses import dataclass
from typing import Optional, Sequence


@dataclass
class Signal:
    action: str  # "buy", "sell", or "hold"
    reason: str


def sma(values: Sequence[float], window: int) -> Optional[float]:
    if len(values) < window:
        return None
    return sum(values[-window:]) / window


def sma_crossover_signal(closes: Sequence[float], fast: int = 20, slow: int = 50) -> Signal:
    """Evaluate a crossover between the last two bars of `closes`."""
    if len(closes) < slow + 1:
        return Signal("hold", "not enough history")

    fast_now = sma(closes, fast)
    slow_now = sma(closes, slow)
    fast_prev = sma(closes[:-1], fast)
    slow_prev = sma(closes[:-1], slow)

    if fast_prev <= slow_prev and fast_now > slow_now:
        return Signal("buy", f"golden cross: SMA{fast} ({fast_now:.2f}) crossed above SMA{slow} ({slow_now:.2f})")

    if fast_prev >= slow_prev and fast_now < slow_now:
        return Signal("sell", f"death cross: SMA{fast} ({fast_now:.2f}) crossed below SMA{slow} ({slow_now:.2f})")

    return Signal("hold", f"no crossover: SMA{fast}={fast_now:.2f}, SMA{slow}={slow_now:.2f}")
