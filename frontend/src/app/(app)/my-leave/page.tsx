"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { LeaveRequest, LeaveType } from "@/lib/types";

export default function MyLeavePage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [reqs, types] = await Promise.all([
        apiFetch<LeaveRequest[]>("/leave-requests/me"),
        apiFetch<LeaveType[]>("/leave-types"),
      ]);
      setRequests(reqs);
      setLeaveTypes(types);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load();
  }, []);

  async function cancel(id: string) {
    await apiFetch(`/leave-requests/${id}/cancel`, { method: "POST" });
    load();
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Leave</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          {showForm ? "Cancel" : "Request leave"}
        </button>
      </div>

      {showForm && (
        <LeaveRequestForm
          leaveTypes={leaveTypes}
          onCreated={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Dates</th>
                <th className="px-4 py-2 font-medium">Days</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-2">{r.leaveType.name}</td>
                  <td className="px-4 py-2 text-slate-500">
                    {new Date(r.startDate).toLocaleDateString()} – {new Date(r.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 text-slate-500">{r.days}</td>
                  <td className="px-4 py-2">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-2">
                    {r.status === "PENDING" && (
                      <button onClick={() => cancel(r.id)} className="text-xs font-medium text-red-600 hover:underline">
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    No leave requests yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: LeaveRequest["status"] }) {
  const styles: Record<LeaveRequest["status"], string> = {
    PENDING: "bg-amber-100 text-amber-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    CANCELLED: "bg-slate-100 text-slate-600",
  };
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}>{status}</span>;
}

function LeaveRequestForm({ leaveTypes, onCreated }: { leaveTypes: LeaveType[]; onCreated: () => void }) {
  const [leaveTypeId, setLeaveTypeId] = useState(leaveTypes[0]?.id ?? "");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiFetch("/leave-requests", {
        method: "POST",
        body: JSON.stringify({ leaveTypeId, startDate, endDate, reason }),
      });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2">
      <label className="text-sm">
        <span className="mb-1 block font-medium text-slate-700">Leave type</span>
        <select
          required
          value={leaveTypeId}
          onChange={(e) => setLeaveTypeId(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          {leaveTypes.map((lt) => (
            <option key={lt.id} value={lt.id}>
              {lt.name}
            </option>
          ))}
        </select>
      </label>
      <div />
      <label className="text-sm">
        <span className="mb-1 block font-medium text-slate-700">Start date</span>
        <input required type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </label>
      <label className="text-sm">
        <span className="mb-1 block font-medium text-slate-700">End date</span>
        <input required type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </label>
      <label className="col-span-2 text-sm">
        <span className="mb-1 block font-medium text-slate-700">Reason (optional)</span>
        <input value={reason} onChange={(e) => setReason(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </label>
      {error && <p className="col-span-2 text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting || !leaveTypeId}
        className="col-span-2 w-fit rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {submitting ? "Submitting…" : "Submit request"}
      </button>
    </form>
  );
}
