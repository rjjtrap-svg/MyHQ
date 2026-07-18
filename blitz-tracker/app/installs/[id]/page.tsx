"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { PaySubmission, STATUS_LABELS } from "@/lib/types";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function InstallDetailPage({ params }: { params: { id: string } }) {
  const [item, setItem] = useState<PaySubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);
  const [paidDate, setPaidDate] = useState(today());

  useEffect(() => {
    supabase
      .from("pay_submissions")
      .select("*")
      .eq("id", params.id)
      .single()
      .then(({ data }) => {
        setItem(data as PaySubmission);
        setLoading(false);
      });
  }, [params.id]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  async function markPaid() {
    if (!item) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("pay_submissions")
      .update({ status: "paid", paid_date: paidDate })
      .eq("id", item.id)
      .select()
      .single();
    setSaving(false);
    if (error) {
      setToast({ text: `Couldn't save: ${error.message}`, error: true });
      return;
    }
    setItem(data as PaySubmission);
    setToast({ text: "Marked as paid." });
  }

  async function revertToSubmitted() {
    if (!item) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("pay_submissions")
      .update({ status: "submitted" })
      .eq("id", item.id)
      .select()
      .single();
    setSaving(false);
    if (error) {
      setToast({ text: `Couldn't save: ${error.message}`, error: true });
      return;
    }
    setItem(data as PaySubmission);
    setToast({ text: "Reverted to submitted." });
  }

  if (loading) return <p className="empty-state">Loading…</p>;
  if (!item) return <p className="empty-state">Not found.</p>;

  return (
    <>
      {toast && <div className={`toast ${toast.error ? "error" : ""}`}>{toast.text}</div>}

      <Link href="/installs" className="back-link">
        ← My Installs
      </Link>

      <h1>{item.plan_sold || "Install"}</h1>
      <p className="subtitle">
        <span className={`badge status-${item.status}`}>{STATUS_LABELS[item.status]}</span>
      </p>

      {item.screenshot_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.screenshot_url} alt="Confirmation screenshot" className="screenshot-full" />
      )}

      <div className="card">
        <h2>Details</h2>
        <div className="detail-row">
          <span className="detail-label">Pay amount</span>
          <span>${Number(item.pay_amount).toFixed(2)}</span>
        </div>
        {item.customer_name && (
          <div className="detail-row">
            <span className="detail-label">Customer</span>
            <span>{item.customer_name}</span>
          </div>
        )}
        {item.address && (
          <div className="detail-row">
            <span className="detail-label">Address</span>
            <span>{item.address}</span>
          </div>
        )}
        {item.install_date && (
          <div className="detail-row">
            <span className="detail-label">Install date</span>
            <span>{item.install_date}</span>
          </div>
        )}
        {item.paid_date && (
          <div className="detail-row">
            <span className="detail-label">Paid date</span>
            <span>{item.paid_date}</span>
          </div>
        )}
        {item.notes && (
          <div className="detail-row">
            <span className="detail-label">Notes</span>
            <span>{item.notes}</span>
          </div>
        )}
      </div>

      <div className="card">
        {item.status === "submitted" && (
          <>
            <label htmlFor="paidDate">Date paid</label>
            <input id="paidDate" type="date" value={paidDate} onChange={(e) => setPaidDate(e.target.value)} />
            <button className="submit-btn" disabled={saving} onClick={markPaid}>
              {saving ? "Saving…" : "Mark Paid"}
            </button>
          </>
        )}
        {item.status === "paid" && (
          <button className="link-btn" disabled={saving} onClick={revertToSubmitted}>
            ← Back to Submitted
          </button>
        )}
      </div>
    </>
  );
}
