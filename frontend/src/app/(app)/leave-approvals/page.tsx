"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { LeaveRequest } from "@/lib/types";

export default function LeaveApprovalsPage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch<LeaveRequest[]>("/leave-requests/pending-approvals");
      setRequests(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load();
  }, []);

  async function decide(id: string, approve: boolean) {
    setError(null);
    try {
      await apiFetch(`/leave-requests/${id}/${approve ? "approve" : "reject"}`, { method: "POST" });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Leave Approvals</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : requests.length === 0 ? (
        <p className="text-sm text-slate-500">No requests waiting for your review.</p>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">
                    {r.employee?.firstName} {r.employee?.lastName}{" "}
                    <span className="font-normal text-slate-500">({r.employee?.employeeCode})</span>
                  </p>
                  <p className="text-sm text-slate-500">
                    {r.leaveType.name} · {new Date(r.startDate).toLocaleDateString()} –{" "}
                    {new Date(r.endDate).toLocaleDateString()} · {r.days} day(s)
                  </p>
                  {r.reason && <p className="mt-1 text-sm text-slate-600">&ldquo;{r.reason}&rdquo;</p>}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => decide(r.id, true)}
                    className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => decide(r.id, false)}
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
