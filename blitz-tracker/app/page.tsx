"use client";

import { useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB

export default function SubmitPage() {
  const [customerName, setCustomerName] = useState("");
  const [address, setAddress] = useState("");
  const [planSold, setPlanSold] = useState("");
  const [installDate, setInstallDate] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function resetForm() {
    setCustomerName("");
    setAddress("");
    setPlanSold("");
    setInstallDate("");
    setPayAmount("");
    setNotes("");
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_FILE_BYTES) {
      setToast({ text: "That image is too large (max 10MB).", error: true });
      return;
    }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!payAmount.trim()) {
      setToast({ text: "Pay amount is required.", error: true });
      return;
    }

    setSubmitting(true);

    let screenshotUrl: string | null = null;
    if (file) {
      const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error: uploadError } = await supabase.storage
        .from("install-screenshots")
        .upload(path, file);
      if (uploadError) {
        setSubmitting(false);
        setToast({ text: `Couldn't upload screenshot: ${uploadError.message}`, error: true });
        return;
      }
      screenshotUrl = supabase.storage.from("install-screenshots").getPublicUrl(path).data.publicUrl;
    }

    const { error } = await supabase.from("pay_submissions").insert({
      customer_name: customerName.trim() || null,
      address: address.trim() || null,
      plan_sold: planSold.trim() || null,
      install_date: installDate || null,
      pay_amount: Number(payAmount),
      notes: notes.trim() || null,
      screenshot_url: screenshotUrl,
    });

    setSubmitting(false);

    if (error) {
      setToast({ text: `Couldn't save: ${error.message}`, error: true });
      return;
    }

    setToast({ text: "Submitted! 🎉" });
    resetForm();
  }

  return (
    <>
      {toast && <div className={`toast ${toast.error ? "error" : ""}`}>{toast.text}</div>}

      <h1>Submit an Install</h1>
      <p className="subtitle">Screenshot, install info, and what you're getting paid.</p>

      <form onSubmit={handleSubmit}>
        <div className="card">
          <label htmlFor="screenshot">Confirmation screenshot</label>
          <input
            id="screenshot"
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
          />
          {previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Screenshot preview" className="screenshot-preview" />
          )}

          <label htmlFor="customerName">Customer name</label>
          <input
            id="customerName"
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Jane Doe"
          />

          <label htmlFor="address">Address</label>
          <input
            id="address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Main St"
          />

          <label htmlFor="planSold">Package / plan</label>
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

          <label htmlFor="payAmount">Pay amount ($)</label>
          <input
            id="payAmount"
            type="text"
            inputMode="decimal"
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
            placeholder="e.g. 75"
          />

          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes"
          />

          <button className="submit-btn" type="submit" disabled={submitting}>
            {submitting ? "Saving…" : "Submit"}
          </button>
        </div>
      </form>
    </>
  );
}
