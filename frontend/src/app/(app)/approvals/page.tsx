"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { ExpenseClaim, LeaveRequest, LoanRequest, TimesheetEntry } from "@/lib/types";

export default function ApprovalsPage() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [timesheets, setTimesheets] = useState<TimesheetEntry[]>([]);
  const [expenses, setExpenses] = useState<ExpenseClaim[]>([]);
  const [loans, setLoans] = useState<LoanRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [leave, ts, exp, ln] = await Promise.all([
        apiFetch<LeaveRequest[]>("/leave-requests/pending-approvals"),
        apiFetch<TimesheetEntry[]>("/timesheets/pending-approvals"),
        apiFetch<ExpenseClaim[]>("/expenses/pending-approvals"),
        apiFetch<LoanRequest[]>("/loans/pending-approvals"),
      ]);
      setLeaveRequests(leave);
      setTimesheets(ts);
      setExpenses(exp);
      setLoans(ln);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load();
  }, []);

  async function decide(basePath: string, id: string, approve: boolean) {
    setError(null);
    try {
      await apiFetch(`${basePath}/${id}/${approve ? "approve" : "reject"}`, { method: "POST" });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  return (
    <div className="max-w-3xl space-y-8">
      <h1 className="text-2xl font-semibold">Approvals</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <ApprovalSection
        title="Leave requests"
        items={leaveRequests}
        loading={loading}
        emptyText="No leave requests waiting for your review."
        onDecide={(id, approve) => decide("/leave-requests", id, approve)}
        renderDetail={(r) => (
          <>
            <p className="font-medium">
              {r.employee?.firstName} {r.employee?.lastName}{" "}
              <span className="font-normal text-slate-500">({r.employee?.employeeCode})</span>
            </p>
            <p className="text-sm text-slate-500">
              {r.leaveType.name} · {new Date(r.startDate).toLocaleDateString()} – {new Date(r.endDate).toLocaleDateString()} ·{" "}
              {r.days} day(s)
            </p>
            {r.reason && <p className="mt-1 text-sm text-slate-600">&ldquo;{r.reason}&rdquo;</p>}
          </>
        )}
      />

      <ApprovalSection
        title="Timesheet entries"
        items={timesheets}
        loading={loading}
        emptyText="No timesheet entries waiting for your review."
        onDecide={(id, approve) => decide("/timesheets", id, approve)}
        renderDetail={(t) => (
          <>
            <p className="font-medium">
              {t.employee?.firstName} {t.employee?.lastName}{" "}
              <span className="font-normal text-slate-500">({t.employee?.employeeCode})</span>
            </p>
            <p className="text-sm text-slate-500">
              {new Date(t.date).toLocaleDateString()} · {t.hours}h{t.task ? ` · ${t.task}` : ""}
            </p>
          </>
        )}
      />

      <ApprovalSection
        title="Expense claims"
        items={expenses}
        loading={loading}
        emptyText="No expense claims waiting for your review."
        onDecide={(id, approve) => decide("/expenses", id, approve)}
        renderDetail={(e) => (
          <>
            <p className="font-medium">
              {e.employee?.firstName} {e.employee?.lastName}{" "}
              <span className="font-normal text-slate-500">({e.employee?.employeeCode})</span>
            </p>
            <p className="text-sm text-slate-500">
              {e.category} · ₹{e.amount.toLocaleString()} · {new Date(e.expenseDate).toLocaleDateString()}
            </p>
            {e.description && <p className="mt-1 text-sm text-slate-600">{e.description}</p>}
          </>
        )}
      />

      <ApprovalSection
        title="Loan requests"
        items={loans}
        loading={loading}
        emptyText="No loan requests waiting for your review."
        onDecide={(id, approve) => decide("/loans", id, approve)}
        renderDetail={(l) => (
          <>
            <p className="font-medium">
              {l.employee?.firstName} {l.employee?.lastName}{" "}
              <span className="font-normal text-slate-500">({l.employee?.employeeCode})</span>
            </p>
            <p className="text-sm text-slate-500">
              ₹{l.amount.toLocaleString()} over {l.emiMonths} months
            </p>
            {l.reason && <p className="mt-1 text-sm text-slate-600">{l.reason}</p>}
          </>
        )}
      />
    </div>
  );
}

function ApprovalSection<T extends { id: string }>({
  title,
  items,
  loading,
  emptyText,
  onDecide,
  renderDetail,
}: {
  title: string;
  items: T[];
  loading: boolean;
  emptyText: string;
  onDecide: (id: string, approve: boolean) => void;
  renderDetail: (item: T) => React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-slate-500">{title}</h2>
      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500">{emptyText}</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>{renderDetail(item)}</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onDecide(item.id, true)}
                    className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => onDecide(item.id, false)}
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
    </section>
  );
}
