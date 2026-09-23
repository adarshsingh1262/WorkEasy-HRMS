"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { AttendanceRecord } from "@/lib/types";

export default function MyAttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch<AttendanceRecord[]>("/attendance/me");
      setRecords(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load();
  }, []);

  const todayIso = new Date().toISOString().slice(0, 10);
  const todayRecord = records.find((r) => r.date.slice(0, 10) === todayIso);

  async function checkIn() {
    setError(null);
    setActionPending(true);
    try {
      await apiFetch("/attendance/check-in", { method: "POST" });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setActionPending(false);
    }
  }

  async function checkOut() {
    setError(null);
    setActionPending(true);
    try {
      await apiFetch("/attendance/check-out", { method: "POST" });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setActionPending(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">My Attendance</h1>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">Today</p>
        <div className="mt-2 flex items-center gap-4">
          <div className="text-sm">
            <span className="text-slate-500">Check-in: </span>
            <span className="font-medium">{formatTime(todayRecord?.checkInAt)}</span>
          </div>
          <div className="text-sm">
            <span className="text-slate-500">Check-out: </span>
            <span className="font-medium">{formatTime(todayRecord?.checkOutAt)}</span>
          </div>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-4 flex gap-2">
          <button
            onClick={checkIn}
            disabled={actionPending || !!todayRecord?.checkInAt}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            Check in
          </button>
          <button
            onClick={checkOut}
            disabled={actionPending || !todayRecord?.checkInAt || !!todayRecord?.checkOutAt}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Check out
          </button>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-slate-500">History</h2>
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Check-in</th>
                  <th className="px-4 py-2 font-medium">Check-out</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-2">{new Date(r.date).toLocaleDateString()}</td>
                    <td className="px-4 py-2 text-slate-500">{formatTime(r.checkInAt)}</td>
                    <td className="px-4 py-2 text-slate-500">{formatTime(r.checkOutAt)}</td>
                  </tr>
                ))}
                {records.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-slate-500">
                      No attendance records yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function formatTime(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
