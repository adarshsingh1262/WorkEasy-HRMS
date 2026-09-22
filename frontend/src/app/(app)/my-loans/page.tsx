"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { LoanRequest } from "@/lib/types";

export default function MyLoansPage() {
  const [loans, setLoans] = useState<LoanRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setLoans(await apiFetch<LoanRequest[]>("/loans/me"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load();
  }, []);

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Loans</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          {showForm ? "Cancel" : "Request loan"}
        </button>
      </div>

      {showForm && (
        <LoanForm
          onCreated={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : loans.length === 0 ? (
        <p className="text-sm text-slate-500">No loan requests yet.</p>
      ) : (
        <div className="space-y-3">
          {loans.map((l) => (
            <div key={l.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="font-medium">₹{l.amount.toLocaleString()} over {l.emiMonths} months</p>
                <StatusBadge status={l.status} />
              </div>
              {l.reason && <p className="mt-1 text-sm text-slate-600">{l.reason}</p>}
              {(l.status === "ACTIVE" || l.status === "CLOSED") && (
                <p className="mt-2 text-xs text-slate-500">
                  ₹{l.monthlyDeduction?.toLocaleString()}/month · ₹{l.remainingAmount?.toLocaleString()} remaining
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: LoanRequest["status"] }) {
  const styles: Record<LoanRequest["status"], string> = {
    PENDING: "bg-amber-100 text-amber-800",
    APPROVED: "bg-green-100 text-green-800",
    ACTIVE: "bg-blue-100 text-blue-800",
    CLOSED: "bg-slate-100 text-slate-600",
    REJECTED: "bg-red-100 text-red-800",
  };
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}>{status}</span>;
}

function LoanForm({ onCreated }: { onCreated: () => void }) {
  const [amount, setAmount] = useState("");
  const [emiMonths, setEmiMonths] = useState("6");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiFetch("/loans", {
        method: "POST",
        body: JSON.stringify({ amount: Number(amount), emiMonths: Number(emiMonths), reason: reason || undefined }),
      });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3">
      <input required type="number" min="1" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
      <input required type="number" min="1" max="60" placeholder="EMI months" value={emiMonths} onChange={(e) => setEmiMonths(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
      <input placeholder="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
      {error && <p className="col-span-3 text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={submitting} className="col-span-3 w-fit rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50">
        {submitting ? "Submitting…" : "Submit request"}
      </button>
    </form>
  );
}
