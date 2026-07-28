from typing import Optional

from supabase import Client, create_client

from config import Config


def get_client(cfg: Config) -> Client:
    return create_client(cfg.supabase_url, cfg.supabase_service_key)


def log_order(
    client: Client,
    *,
    ticker: str,
    side: str,
    qty: float,
    reason: str,
    broker_order_id: Optional[str],
    status: str = "submitted",
):
    client.table("orders").insert(
        {
            "ticker": ticker,
            "side": side,
            "qty": qty,
            "signal_reason": reason,
            "broker_order_id": broker_order_id,
            "status": status,
        }
    ).execute()


def upsert_position(client: Client, *, ticker: str, qty: float, avg_entry_price: Optional[float]):
    client.table("positions").upsert(
        {"ticker": ticker, "qty": qty, "avg_entry_price": avg_entry_price},
        on_conflict="ticker",
    ).execute()


def log_equity_snapshot(client: Client, *, equity: float, cash: float, positions_value: float):
    client.table("equity_snapshots").insert(
        {"equity": equity, "cash": cash, "positions_value": positions_value}
    ).execute()
