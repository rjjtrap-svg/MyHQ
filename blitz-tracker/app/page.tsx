"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Outcome, OUTCOME_LABELS } from "@/lib/types";

const OUTCOMES: Outcome[] = ["sale", "not_home", "not_interested", "callback", "other"];

function nowForInput() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default function LogDealPage() {
  const [repName, setRepName] = useState("");
  const [knownReps, setKnownReps] = useState<string[]>([]);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [address, setAddress] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [planSold, setPlanSold] = useState("");
  const [installDate, setInstallDate] = useState("");
  const [dealTime, setDealTime] = useState(nowForInput());
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);

  useEffect(() => {
    const savedRep = localStorage.getItem("blitz_rep_name");
    if (savedRep) setRepName(savedRep);

    supabase
      .from("blitz_deals")
      .select("rep_name")
      .then(({ data }) => {
        if (data) {
          const unique = Array.from(new Set(data.map((d) => d.rep_name))).sort();
          setKnownReps(unique);
        }
      });
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  function resetFormKeepingRep() {
    setOutcome(null);
    setAddress("");
    setCustomerName("");
    setCustomerPhone("");
    setPlanSold("");
    setInstallDate("");
    setDealTime(nowForInput());
    setNotes("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!repName.trim() || !outcome || !address.trim()) {
      setToast({ text: "Rep name, outcome, and address are required.", error: true });
      return;
    }

    setSubmitting(true);
    localStorage.setItem("blitz_rep_name", repName.trim());

    const { error } = await supabase.from("blitz_deals").insert({
      rep_name: repName.trim(),
      outcome,
      address: address.trim(),
      customer_name: outcome === "sale" ? customerName.trim() || null : null,
      customer_phone: outcome === "sale" ? customerPhone.trim() || null : null,
      plan_sold: outcome === "sale" ? planSold.trim() || null : null,
      install_date: outcome === "sale" && installDate ? installDate : null,
      deal_time: new Date(dealTime).toISOString(),
      notes: notes.trim() || null,
      stage: outcome === "sale" ? "signed" : null,
    });

    setSubmitting(false);

    if (error) {
      setToast({ text: `Couldn't save: ${error.message}`, error: true });
      return;
    }

    setToast({ text: outcome === "sale" ? "Sale logged! 🎉" : "Outcome logged." });
    resetFormKeepingRep();
  }

  return (
    <>
      {toast && <div className={`toast ${toast.error ? "error" : ""}`}>{toast.text}</div>}

      <h1>Log a Deal</h1>
      <p className="subtitle">Track every door — sales and non-sales both count.</p>

      <form onSubmit={handleSubmit}>
        <div className="card">
          <label htmlFor="rep">Rep name</label>
          <input
            id="rep"
            type="text"
            list="rep-list"
            value={repName}
            onChange={(e) => setRepName(e.target.value)}
            placeholder="Your name"
            autoComplete="off"
          />
          <datalist id="rep-list">
            {knownReps.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>

          <label>Outcome</label>
          <div className="outcome-grid">
            {OUTCOMES.map((o) => (
              <button
                key={o}
                type="button"
                className={`outcome-btn ${o} ${outcome === o ? "selected " + o : ""}`}
                onClick={() => setOutcome(o)}
              >
                {OUTCOME_LABELS[o]}
              </button>
            ))}
          </div>

          <label htmlFor="address">Address</label>
          <input
            id="address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Main St"
          />

          {outcome === "sale" && (
            <>
              <label htmlFor="customerName">Customer name</label>
              <input
                id="customerName"
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Jane Doe"
              />

              <label htmlFor="customerPhone">Customer phone</label>
              <input
                id="customerPhone"
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="(555) 555-5555"
              />

              <label htmlFor="planSold">Plan sold</label>
              <input
                id="planSold"
                type="text"
                value={planSold}
                onChange={(e) => setPlanSold(e.target.value)}
                placeholder="e.g. Gigabit Fiber"
              />

              <label htmlFor="installDate">Install date</label>
              <input
                id="installDate"
                type="date"
                value={installDate}
                onChange={(e) => setInstallDate(e.target.value)}
              />
            </>
          )}

          <label htmlFor="dealTime">Date/time of deal</label>
          <input
            id="dealTime"
            type="datetime-local"
            value={dealTime}
            onChange={(e) => setDealTime(e.target.value)}
          />

          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes"
          />

          <button className="submit-btn" type="submit" disabled={submitting}>
            {submitting ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </>
  );
}
