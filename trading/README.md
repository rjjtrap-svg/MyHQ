# Paper trading — SMA(20/50) crossover

Scaffold for running the moving-average crossover strategy (the one from the
2026-07-12 AAPL backtest) live against Alpaca's **paper** trading account,
with every order and equity snapshot logged to Supabase.

## What's here

- `strategy.py` — pure signal logic (golden/death cross), unit tested.
- `data.py` — pulls daily close prices from Alpaca's market data API.
- `broker.py` — Alpaca paper trading client: check position, submit market order.
- `db.py` — writes orders/positions/equity to Supabase.
- `config.py` — loads everything from `.env`.
- `run_paper_trade.py` — the entry point. Run it once a day.
- `tests/test_strategy.py` — crossover logic tests, no network needed.

## What you need to do

1. **Get Alpaca paper keys.** Sign up at alpaca.markets, open the paper
   trading dashboard, generate an API key + secret. No real money involved.
2. **Get the Supabase service role key.** In the Supabase dashboard for this
   project → Project Settings → API → `service_role` secret. (Not the anon
   key — the new tables have RLS on with no public policy, so only the
   service role can write.)
3. **Configure:**
   ```
   cd trading
   cp env.example .env
   # fill in ALPACA_API_KEY, ALPACA_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY
   ```
4. **Install deps:**
   ```
   python3 -m venv .venv && source .venv/bin/activate
   pip install -r requirements.txt
   ```
5. **Run the tests** (no keys required):
   ```
   pytest tests/
   ```
6. **Run it:**
   ```
   python run_paper_trade.py
   ```
   It fetches the last ~120 days of daily closes, checks for a crossover,
   and only places an order if one just happened. Safe to run repeatedly —
   it's a no-op most days.
7. **Schedule it.** Daily crossover strategy only needs to run once a day,
   after market close. Cron example:
   ```
   0 21 * * 1-5 cd /path/to/trading && .venv/bin/python run_paper_trade.py >> run.log 2>&1
   ```
   (A GitHub Actions workflow would also work, but needs the secrets above
   added as repo secrets — ask if you want that instead of local cron.)

## Data model (Supabase)

- `backtest_runs` — pre-existing, one-off backtest results.
- `positions` — current qty per ticker (upserted on every trade).
- `orders` — every order this bot has submitted, with the signal reason.
- `equity_snapshots` — account equity/cash logged on every run, so you can
  chart performance over time.

## Known gaps / next steps

- Single ticker, single strategy, no risk limits beyond `TRADE_QTY`.
- No fill confirmation — `run_paper_trade.py` logs the order as submitted,
  not confirmed filled. Good enough for paper trading; would need a
  webhook or polling loop for anything more serious.
- No retry/alerting if a run fails (e.g. cron silently skips a day).
