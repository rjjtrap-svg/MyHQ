"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { PaySubmission, STATUS_LABELS, Status } from "@/lib/types";

type StatusFilter = "all" | Status;

export default function InstallsPage() {
  const [submissions, setSubmissions] = useState<PaySubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    supabase
      .from("pay_submissions")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setSubmissions((data as PaySubmission[]) || []);
        setLoading(false);
      });
  }, []);

  const totals = useMemo(() => {
    const paid = submissions.filter((s) => s.status === "paid");
    const pending = submissions.filter((s) => s.status === "submitted");
    return {
      paidTotal: paid.reduce((sum, s) => sum + Number(s.pay_amount), 0),
      pendingTotal: pending.reduce((sum, s) => sum + Number(s.pay_amount), 0),
      paidCount: paid.length,
      pendingCount: pending.length,
    };
  }, [submissions]);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return submissions;
    return submissions.filter((s) => s.status === statusFilter);
  }, [submissions, statusFilter]);

  return (
    <>
      <h1>My Installs</h1>
      <p className="subtitle">What you've submitted and what you're owed.</p>

      {!loading && (
        <div className="stat-grid">
          <div className="stat-tile">
            <div className="value">${totals.pendingTotal.toFixed(2)}</div>
            <div className="label">Pending ({totals.pendingCount})</div>
          </div>
          <div className="stat-tile">
            <div className="value">${totals.paidTotal.toFixed(2)}</div>
            <div className="label">Paid ({totals.paidCount})</div>
          </div>
        </div>
      )}

      <div className="filter-row">
        <button
          className={`filter-chip ${statusFilter === "all" ? "active" : ""}`}
          onClick={() => setStatusFilter("all")}
        >
          All
        </button>
        <button
          className={`filter-chip ${statusFilter === "submitted" ? "active" : ""}`}
          onClick={() => setStatusFilter("submitted")}
        >
          Submitted
        </button>
        <button
          className={`filter-chip ${statusFilter === "paid" ? "active" : ""}`}
          onClick={() => setStatusFilter("paid")}
        >
          Paid
        </button>
      </div>

      {loading ? (
        <p className="empty-state">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="empty-state">Nothing here yet.</p>
      ) : (
        filtered.map((s) => (
          <Link href={`/installs/${s.id}`} className="deal-card-link" key={s.id}>
            <div className="deal-card install-card">
              {s.screenshot_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.screenshot_url} alt="" className="install-thumb" />
              )}
              <div className="install-card-body">
                <div className="deal-card-top">
                  <span className={`badge status-${s.status}`}>{STATUS_LABELS[s.status]}</span>
                  <span className="time">
                    {new Date(s.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="address">{s.plan_sold || "Package not set"}</div>
                {s.customer_name && <div className="meta">{s.customer_name}</div>}
                <div className="meta pay-amount">${Number(s.pay_amount).toFixed(2)}</div>
              </div>
            </div>
          </Link>
        ))
      )}
    </>
  );
}
