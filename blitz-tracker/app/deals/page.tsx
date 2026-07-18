"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Deal, OUTCOME_LABELS, Stage, STAGE_LABELS, STAGES } from "@/lib/types";

type StageFilter = "all" | Stage;

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [repFilter, setRepFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [stageFilter, setStageFilter] = useState<StageFilter>("all");

  useEffect(() => {
    const stageParam = new URLSearchParams(window.location.search).get("stage") as StageFilter | null;
    if (stageParam && (stageParam === "signed" || stageParam === "installed" || stageParam === "paid")) {
      setStageFilter(stageParam);
    }
  }, []);

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

  const reps = useMemo(() => Array.from(new Set(deals.map((d) => d.rep_name))).sort(), [deals]);

  const filtered = useMemo(() => {
    return deals.filter((d) => {
      if (repFilter !== "all" && d.rep_name !== repFilter) return false;
      if (stageFilter !== "all" && d.stage !== stageFilter) return false;
      if (dateFilter) {
        const dealDate = new Date(d.deal_time).toISOString().slice(0, 10);
        if (dealDate !== dateFilter) return false;
      }
      return true;
    });
  }, [deals, repFilter, dateFilter, stageFilter]);

  return (
    <>
      <h1>All Deals</h1>
      <p className="subtitle">
        {filtered.length} of {deals.length} logged
      </p>

      <div className="filter-row">
        <button
          className={`filter-chip ${stageFilter === "all" ? "active" : ""}`}
          onClick={() => setStageFilter("all")}
        >
          All Stages
        </button>
        {STAGES.map((s) => (
          <button
            key={s}
            className={`filter-chip ${stageFilter === s ? "active" : ""}`}
            onClick={() => setStageFilter(s)}
          >
            {STAGE_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="select-row">
        <select value={repFilter} onChange={(e) => setRepFilter(e.target.value)}>
          <option value="all">All Reps</option>
          {reps.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
      </div>

      {dateFilter && (
        <button className="filter-chip" style={{ marginBottom: 16 }} onClick={() => setDateFilter("")}>
          Clear date ✕
        </button>
      )}

      {loading ? (
        <p className="empty-state">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="empty-state">No deals match this filter.</p>
      ) : (
        filtered.map((d) => (
          <Link href={`/deals/${d.id}`} className="deal-card-link" key={d.id}>
            <div className="deal-card">
              <div className="deal-card-top">
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <span className={`badge ${d.outcome}`}>{OUTCOME_LABELS[d.outcome]}</span>
                  {d.stage && <span className={`badge stage-${d.stage}`}>{STAGE_LABELS[d.stage]}</span>}
                </div>
                <span className="time">
                  {new Date(d.deal_time).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="address">{d.address}</div>
              <div className="meta">Rep: {d.rep_name}</div>
              {d.outcome === "sale" && (
                <>
                  {d.customer_name && <div className="meta">Customer: {d.customer_name}</div>}
                  {d.plan_sold && <div className="meta">Plan: {d.plan_sold}</div>}
                  {d.stage === "paid" && d.payout_amount != null && (
                    <div className="meta">Payout: ${d.payout_amount}</div>
                  )}
                </>
              )}
            </div>
          </Link>
        ))
      )}
    </>
  );
}
