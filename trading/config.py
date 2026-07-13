import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


def _require(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


@dataclass(frozen=True)
class Config:
    ticker: str
    fast_window: int
    slow_window: int
    trade_qty: int
    alpaca_api_key: str
    alpaca_secret_key: str
    alpaca_paper: bool
    supabase_url: str
    supabase_service_key: str


def load_config() -> Config:
    return Config(
        ticker=os.environ.get("TICKER", "AAPL"),
        fast_window=int(os.environ.get("FAST_WINDOW", "20")),
        slow_window=int(os.environ.get("SLOW_WINDOW", "50")),
        trade_qty=int(os.environ.get("TRADE_QTY", "10")),
        alpaca_api_key=_require("ALPACA_API_KEY"),
        alpaca_secret_key=_require("ALPACA_SECRET_KEY"),
        alpaca_paper=os.environ.get("ALPACA_PAPER", "true").lower() == "true",
        supabase_url=os.environ.get("SUPABASE_URL", "https://ybrairokaqjoyvhqbvai.supabase.co"),
        supabase_service_key=_require("SUPABASE_SERVICE_ROLE_KEY"),
    )
