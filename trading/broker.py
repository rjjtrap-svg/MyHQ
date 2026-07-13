from alpaca.trading.client import TradingClient
from alpaca.trading.enums import OrderSide, TimeInForce
from alpaca.trading.requests import MarketOrderRequest

from config import Config


def get_trading_client(cfg: Config) -> TradingClient:
    return TradingClient(cfg.alpaca_api_key, cfg.alpaca_secret_key, paper=cfg.alpaca_paper)


def get_position_qty(client: TradingClient, ticker: str) -> float:
    try:
        position = client.get_open_position(ticker)
        return float(position.qty)
    except Exception:
        return 0.0


def submit_market_order(client: TradingClient, ticker: str, qty: float, side: OrderSide):
    order = MarketOrderRequest(
        symbol=ticker,
        qty=qty,
        side=side,
        time_in_force=TimeInForce.DAY,
    )
    return client.submit_order(order)
