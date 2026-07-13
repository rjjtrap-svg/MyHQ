"""Entry point: pull data, evaluate the SMA crossover signal, and (maybe) trade.

Safe to run daily on a schedule (cron / GitHub Actions) — it only places an
order on an actual crossover; otherwise it's a no-op. Every run logs an
equity snapshot to Supabase regardless of whether it traded.
"""
from alpaca.trading.enums import OrderSide

from broker import get_position_qty, get_trading_client, submit_market_order
from config import load_config
from data import get_daily_closes
from db import get_client, log_equity_snapshot, log_order, upsert_position
from strategy import sma_crossover_signal


def main() -> None:
    cfg = load_config()
    closes = get_daily_closes(cfg)
    signal = sma_crossover_signal(closes, cfg.fast_window, cfg.slow_window)
    print(f"[{cfg.ticker}] signal={signal.action} ({signal.reason})")

    trading_client = get_trading_client(cfg)
    db = get_client(cfg)
    current_qty = get_position_qty(trading_client, cfg.ticker)

    if signal.action == "buy" and current_qty == 0:
        order = submit_market_order(trading_client, cfg.ticker, cfg.trade_qty, OrderSide.BUY)
        log_order(
            db,
            ticker=cfg.ticker,
            side="buy",
            qty=cfg.trade_qty,
            reason=signal.reason,
            broker_order_id=str(order.id),
        )
        upsert_position(db, ticker=cfg.ticker, qty=cfg.trade_qty, avg_entry_price=None)
        print(f"Submitted BUY {cfg.trade_qty} {cfg.ticker}")
    elif signal.action == "sell" and current_qty > 0:
        order = submit_market_order(trading_client, cfg.ticker, current_qty, OrderSide.SELL)
        log_order(
            db,
            ticker=cfg.ticker,
            side="sell",
            qty=current_qty,
            reason=signal.reason,
            broker_order_id=str(order.id),
        )
        upsert_position(db, ticker=cfg.ticker, qty=0, avg_entry_price=None)
        print(f"Submitted SELL {current_qty} {cfg.ticker}")
    else:
        print("No action taken.")

    account = trading_client.get_account()
    equity = float(account.equity)
    cash = float(account.cash)
    log_equity_snapshot(db, equity=equity, cash=cash, positions_value=equity - cash)


if __name__ == "__main__":
    main()
