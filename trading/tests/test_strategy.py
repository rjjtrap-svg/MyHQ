import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from strategy import sma_crossover_signal


def _flat(price: float, n: int) -> list:
    return [price] * n


def test_golden_cross_triggers_buy():
    closes = _flat(100.0, 50) + [200.0]
    signal = sma_crossover_signal(closes, fast=5, slow=50)
    assert signal.action == "buy"


def test_death_cross_triggers_sell():
    closes = _flat(200.0, 50) + [1.0]
    signal = sma_crossover_signal(closes, fast=5, slow=50)
    assert signal.action == "sell"


def test_no_crossover_holds():
    closes = _flat(100.0, 60)
    signal = sma_crossover_signal(closes, fast=5, slow=50)
    assert signal.action == "hold"


def test_not_enough_history_holds():
    closes = _flat(100.0, 10)
    signal = sma_crossover_signal(closes, fast=5, slow=50)
    assert signal.action == "hold"
