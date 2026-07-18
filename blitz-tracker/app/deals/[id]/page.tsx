"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Deal, OUTCOME_LABELS, STAGE_LABELS } from "@/lib/types";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function DealDetailPage({ params }: { params: { id: string } }) {
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);

  const [installCompletedDate, setInstallCompletedDate] = useState(today());
  const [paidDate, setPaidDate] = useState(today());
  const [payoutAmount, setPayoutAmount] = useState("");

  useEffect(() => {
    supabase
      .from("blitz_deals")
      .select("*")
      .eq("id", params.id)
      .single()
      .then(({ data }) => {
        setDeal(data as Deal);
        setLoading(false);
      });
  }, [params.id]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  async function markInstalled() {
    if (!deal) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("blitz_deals")
      .update({ stage: "installed", install_completed_date: installCompletedDate })
      .eq("id", deal.id)
      .select()
      .single();
    setSaving(false);
    if (error) {
      setToast({ text: `Couldn't save: ${error.message}`, error: true });
      return;
    }
    setDeal(data as Deal);
    setToast({ text: "Marked as installed." });
  }

  async function markPaid() {
    if (!deal) return;
    if (!payoutAmount.trim()) {
      setToast({ text: "Enter a payout amount.", error: true });
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from("blitz_deals")
      .update({ stage: "paid", paid_date: paidDate, payout_amount: Number(payoutAmount) })
      .eq("id", deal.id)
      .select()
      .single();
    setSaving(false);
    if (error) {
      setToast({ text: `Couldn't save: ${error.message}`, error: true });
      return;
    }
    setDeal(data as Deal);
    setToast({ text: "Marked as paid." });
  }

  async function revertToSigned() {
    if (!deal) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("blitz_deals")
      .update({ stage: "signed" })
      .eq("id", deal.id)
      .select()
      .single();
    setSaving(false);
    if (error) {
      setToast({ text: `Couldn't save: ${error.message}`, error: true });
      return;
    }
    setDeal(data as Deal);
    setToast({ text: "Reverted to signed." });
  }

  if (loading) return <p className="empty-state">Loading…</p>;
  if (!deal) return <p className="empty-state">Deal not found.</p>;

  return (
    <>
      {toast && <div className={`toast ${toast.error ? "error" : ""}`}>{toast.text}</div>}

      <Link href="/deals" className="back-link">
        ← All Deals
      </Link>

      <h1>{deal.address}</h1>
      <p className="subtitle">
        <span className={`badge ${deal.outcome}`}>{OUTCOME_LABELS[deal.outcome]}</span>
        {deal.stage && (
          <span className={`badge stage-${deal.stage}`} style={{ marginLeft: 6 }}>
            {STAGE_LABELS[deal.stage]}
          </span>
        )}
      </p>

      <div className="card">
        <h2>Deal Info</h2>
        <div className="detail-row">
          <span className="detail-label">Rep</span>
          <span>{deal.rep_name}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Date/time</span>
          <span>{new Date(deal.deal_time).toLocaleString()}</span>
        </div>
        {deal.customer_name && (
          <div className="detail-row">
            <span className="detail-label">Customer</span>
            <span>{deal.customer_name}</span>
          </div>
        )}
        {deal.customer_phone && (
          <div className="detail-row">
            <span className="detail-label">Phone</span>
            <span>{deal.customer_phone}</span>
          </div>
        )}
        {deal.plan_sold && (
          <div className="detail-row">
            <span className="detail-label">Plan</span>
            <span>{deal.plan_sold}</span>
          </div>
        )}
        {deal.install_date && (
          <div className="detail-row">
            <span className="detail-label">Install (scheduled)</span>
            <span>{deal.install_date}</span>
          </div>
        )}
        {deal.notes && (
          <div className="detail-row">
            <span className="detail-label">Notes</span>
            <span>{deal.notes}</span>
          </div>
        )}
      </div>

      {deal.outcome === "sale" && (
        <div className="card">
          <h2>Pipeline Stage</h2>

          {deal.stage === "signed" && (
            <>
              <p className="meta">Mark installed once the install actually happens.</p>
              <label htmlFor="installCompletedDate">Install completed date</label>
              <input
                id="installCompletedDate"
                type="date"
                value={installCompletedDate}
                onChange={(e) => setInstallCompletedDate(e.target.value)}
              />
              <button className="submit-btn" disabled={saving} onClick={markInstalled}>
                {saving ? "Saving…" : "Mark Installed"}
              </button>
            </>
          )}

          {deal.stage === "installed" && (
            <>
              {deal.install_completed_date && (
                <p className="meta">Installed {deal.install_completed_date}.</p>
              )}
              <p className="meta">Mark paid once the commission/payout comes in.</p>
              <label htmlFor="paidDate">Date paid</label>
              <input id="paidDate" type="date" value={paidDate} onChange={(e) => setPaidDate(e.target.value)} />
              <label htmlFor="payoutAmount">Payout amount ($)</label>
              <input
                id="payoutAmount"
                type="text"
                inputMode="decimal"
                placeholder="e.g. 75"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
              />
              <button className="submit-btn" disabled={saving} onClick={markPaid}>
                {saving ? "Saving…" : "Mark Paid"}
              </button>
              <button className="link-btn" disabled={saving} onClick={revertToSigned}>
                ← Back to Signed
              </button>
            </>
          )}

          {deal.stage === "paid" && (
            <>
              {deal.install_completed_date && (
                <div className="detail-row">
                  <span className="detail-label">Installed</span>
                  <span>{deal.install_completed_date}</span>
                </div>
              )}
              <div className="detail-row">
                <span className="detail-label">Paid</span>
                <span>{deal.paid_date}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Payout</span>
                <span>${deal.payout_amount}</span>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
