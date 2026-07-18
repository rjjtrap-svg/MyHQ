"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Deal, OUTCOME_LABELS } from "@/lib/types";

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [repFilter, setRepFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

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
      if (dateFilter) {
        const dealDate = new Date(d.deal_time).toISOString().slice(0, 10);
        if (dealDate !== dateFilter) return false;
      }
      return true;
    });
  }, [deals, repFilter, dateFilter]);

  return (
    <>
      <h1>All Deals</h1>
      <p className="subtitle">
        {filtered.length} of {deals.length} logged
      </p>

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
          <div className="deal-card" key={d.id}>
            <div className="deal-card-top">
              <span className={`badge ${d.outcome}`}>{OUTCOME_LABELS[d.outcome]}</span>
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
                {d.customer_phone && <div className="meta">Phone: {d.customer_phone}</div>}
                {d.plan_sold && <div className="meta">Plan: {d.plan_sold}</div>}
                {d.install_date && <div className="meta">Install: {d.install_date}</div>}
              </>
            )}
            {d.notes && <div className="meta">Notes: {d.notes}</div>}
          </div>
        ))
      )}
    </>
  );
}
