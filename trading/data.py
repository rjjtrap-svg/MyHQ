from datetime import datetime, timedelta, timezone

from alpaca.data.historical import StockHistoricalDataClient
from alpaca.data.requests import StockBarsRequest
from alpaca.data.timeframe import TimeFrame

from config import Config


def get_daily_closes(cfg: Config, lookback_days: int = 120) -> list:
    """Fetch daily close prices for cfg.ticker, oldest first."""
    client = StockHistoricalDataClient(cfg.alpaca_api_key, cfg.alpaca_secret_key)
    request = StockBarsRequest(
        symbol_or_symbols=cfg.ticker,
        timeframe=TimeFrame.Day,
        start=datetime.now(timezone.utc) - timedelta(days=lookback_days),
    )
    bars = client.get_stock_bars(request)
    return [bar.close for bar in bars[cfg.ticker]]
