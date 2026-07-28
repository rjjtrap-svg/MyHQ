# Decision Log

Use this file to record decisions as they're made. Copy the template below for each new entry, most recent first.

---

## 2026-07-13 — Alpaca paper trading + Supabase for the SMA crossover bot

**Decision:** Scaffolded `trading/` to run the existing SMA(20/50) crossover strategy against Alpaca's paper trading API, using it as both the market data source and the broker. Orders, positions, and equity snapshots are logged to new Supabase tables (`positions`, `orders`, `equity_snapshots`), alongside the existing `backtest_runs` table.

**Why:** Alpaca gives free paper trading and market data through one SDK, minimizing integration surface for a first working version. Supabase was already wired into this repo (`.mcp.json`, existing `backtest_runs` table), so reusing it for live logging avoids standing up separate infra. RLS is enabled on the new tables with no public policy, matching the existing table's posture — only the service role key (held locally in `.env`, never committed) can write.

**What would change my mind:** Wanting a real (non-paper) broker, multi-strategy/multi-ticker support, or a data provider Alpaca doesn't cover well would justify swapping the data/broker layer. Right now it's a single-ticker, single-strategy scaffold meant to be easy to run, not a production system.

---

## YYYY-MM-DD — Decision title

**Decision:** What was decided.

**Why:** The reasoning behind it — context, constraints, tradeoffs considered.

**What would change my mind:** The specific new information, outcome, or condition that would prompt revisiting this decision.

---
