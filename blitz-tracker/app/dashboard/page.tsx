"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Deal } from "@/lib/types";

type RangeKey = "today" | "7d" | "all";

const RANGES: { key: RangeKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "7d", label: "Last 7 Days" },
  { key: "all", label: "All Time" },
];

function startOfRange(range: RangeKey): Date | null {
  const now = new Date();
  if (range === "today") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (range === "7d") {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  return null;
}

export default function DashboardPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<RangeKey>("today");

  useEffect(() => {
    supabase
      .from("blitz_deals")
      .select("*")
      .order("deal_time", { ascending: false })
      .then(({ data }) => {
        setDeals((data as Deal[]) || []);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    const start = startOfRange(range);
    if (!start) return deals;
    return deals.filter((d) => new Date(d.deal_time) >= start);
  }, [deals, range]);

  const stats = useMemo(() => {
    const totalDoors = filtered.length;
    const totalSales = filtered.filter((d) => d.outcome === "sale").length;
    const conversion = totalDoors > 0 ? Math.round((totalSales / totalDoors) * 100) : 0;

    const byRep = new Map<string, number>();
    const salesByRep = new Map<string, number>();
    const byDay = new Map<string, number>();

    for (const d of filtered) {
      byRep.set(d.rep_name, (byRep.get(d.rep_name) || 0) + 1);
      if (d.outcome === "sale") {
        salesByRep.set(d.rep_name, (salesByRep.get(d.rep_name) || 0) + 1);
      }
      const day = new Date(d.deal_time).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      byDay.set(day, (byDay.get(day) || 0) + 1);
    }

    const repLeaderboard = Array.from(salesByRep.entries()).sort((a, b) => b[1] - a[1]);
    const doorsLeaderboard = Array.from(byRep.entries()).sort((a, b) => b[1] - a[1]);
    const dayBreakdown = Array.from(byDay.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));

    const signedCount = filtered.filter((d) => d.stage === "signed").length;
    const installedCount = filtered.filter((d) => d.stage === "installed").length;
    const paidCount = filtered.filter((d) => d.stage === "paid").length;
    const totalPayout = filtered
      .filter((d) => d.stage === "paid" && d.payout_amount != null)
      .reduce((sum, d) => sum + Number(d.payout_amount), 0);

    return {
      totalDoors,
      totalSales,
      conversion,
      repLeaderboard,
      doorsLeaderboard,
      dayBreakdown,
      signedCount,
      installedCount,
      paidCount,
      totalPayout,
    };
  }, [filtered]);

  return (
    <>
      <h1>Dashboard</h1>
      <p className="subtitle">Blitz totals at a glance.</p>

      <div className="filter-row">
        {RANGES.map((r) => (
          <button
            key={r.key}
            className={`filter-chip ${range === r.key ? "active" : ""}`}
            onClick={() => setRange(r.key)}
          >
            {r.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="empty-state">Loading…</p>
      ) : (
        <>
          <div className="stat-grid">
            <div className="stat-tile">
              <div className="value">{stats.totalDoors}</div>
              <div className="label">Doors Worked</div>
            </div>
            <div className="stat-tile">
              <div className="value">{stats.totalSales}</div>
              <div className="label">Sales</div>
            </div>
            <div className="stat-tile">
              <div className="value">{stats.conversion}%</div>
              <div className="label">Conversion</div>
            </div>
            <div className="stat-tile">
              <div className="value">{stats.repLeaderboard.length}</div>
              <div className="label">Reps Active</div>
            </div>
          </div>

          <div className="card">
            <h2>Sales Pipeline</h2>
            <div className="pipeline-row">
              <Link href="/deals?stage=signed" className="pipeline-tile stage-signed">
                <div className="value">{stats.signedCount}</div>
                <div className="label">Signed, not installed</div>
              </Link>
              <Link href="/deals?stage=installed" className="pipeline-tile stage-installed">
                <div className="value">{stats.installedCount}</div>
                <div className="label">Installed, not paid</div>
              </Link>
              <Link href="/deals?stage=paid" className="pipeline-tile stage-paid">
                <div className="value">{stats.paidCount}</div>
                <div className="label">Paid</div>
              </Link>
            </div>
            {stats.paidCount > 0 && (
              <p className="meta" style={{ marginTop: 10 }}>
                Total paid out: ${stats.totalPayout.toFixed(2)}
              </p>
            )}
          </div>

          <div className="card">
            <h2>Sales by Rep</h2>
            {stats.repLeaderboard.length === 0 && <p className="empty-state">No sales yet.</p>}
            {stats.repLeaderboard.map(([name, count]) => (
              <div className="leaderboard-row" key={name}>
                <span className="name">{name}</span>
                <span className="count">{count}</span>
              </div>
            ))}
          </div>

          <div className="card">
            <h2>Doors Worked by Rep</h2>
            {stats.doorsLeaderboard.length === 0 && <p className="empty-state">No deals logged yet.</p>}
            {stats.doorsLeaderboard.map(([name, count]) => (
              <div className="leaderboard-row" key={name}>
                <span className="name">{name}</span>
                <span className="count">{count}</span>
              </div>
            ))}
          </div>

          <div className="card">
            <h2>Deals by Day</h2>
            {stats.dayBreakdown.length === 0 && <p className="empty-state">No deals logged yet.</p>}
            {stats.dayBreakdown.map(([day, count]) => (
              <div className="leaderboard-row" key={day}>
                <span className="name">{day}</span>
                <span className="count">{count}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
