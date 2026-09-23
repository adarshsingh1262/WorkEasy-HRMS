"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { Employee, ExpenseClaim, LoanRequest, PayrollRun, Payslip } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function PayrollPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [expenses, setExpenses] = useState<ExpenseClaim[]>([]);
  const [loans, setLoans] = useState<LoanRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payslipsByRun, setPayslipsByRun] = useState<Record<string, Payslip[]>>({});

  async function load() {
    setLoading(true);
    try {
      const [emps, r, exp, ln] = await Promise.all([
        apiFetch<Employee[]>("/employees"),
        apiFetch<PayrollRun[]>("/payroll"),
        apiFetch<ExpenseClaim[]>("/expenses"),
        apiFetch<LoanRequest[]>("/loans"),
      ]);
      setEmployees(emps);
      setRuns(r);
      setExpenses(exp);
      setLoans(ln);
    } finally {
      setLoading(false);
    }
  }

  async function markReimbursed(id: string) {
    await apiFetch(`/expenses/${id}/mark-reimbursed`, { method: "POST" });
    load();
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load();
  }, []);

  async function processRun(id: string) {
    setError(null);
    try {
      const result = await apiFetch<{ payslips: Payslip[] }>(`/payroll/${id}/process`, { method: "POST" });
      setPayslipsByRun((prev) => ({ ...prev, [id]: result.payslips }));
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  async function viewPayslips(id: string) {
    const payslips = await apiFetch<Payslip[]>(`/payroll/${id}/payslips`);
    setPayslipsByRun((prev) => ({ ...prev, [id]: payslips }));
  }

  return (
    <div className="max-w-3xl space-y-8">
      <h1 className="text-2xl font-semibold">Payroll</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <CompensationForm employees={employees} />

      <NewRunForm onCreated={load} />

      <div>
        <h2 className="mb-2 text-sm font-medium text-slate-500">Payroll runs</h2>
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : (
          <div className="space-y-3">
            {runs.map((run) => (
              <div key={run.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {MONTH_NAMES[run.month - 1]} {run.year}
                    </p>
                    <StatusBadge status={run.status} />
                  </div>
                  {run.status === "DRAFT" ? (
                    <button onClick={() => processRun(run.id)} className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700">
                      Process
                    </button>
                  ) : (
                    <button onClick={() => viewPayslips(run.id)} className="text-xs font-medium text-indigo-600 hover:underline">
                      View payslips
                    </button>
                  )}
                </div>
                {payslipsByRun[run.id] && (
                  <table className="mt-3 w-full text-xs">
                    <thead className="text-left text-slate-500">
                      <tr>
                        <th className="py-1 font-medium">Employee</th>
                        <th className="py-1 font-medium">Gross</th>
                        <th className="py-1 font-medium">Deductions</th>
                        <th className="py-1 font-medium">Net</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payslipsByRun[run.id].map((p) => (
                        <tr key={p.id}>
                          <td className="py-1">
                            {p.employee?.firstName} {p.employee?.lastName}
                          </td>
                          <td className="py-1">₹{p.grossPay.toLocaleString()}</td>
                          <td className="py-1">₹{p.deductions.toLocaleString()}</td>
                          <td className="py-1">₹{p.netPay.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))}
            {runs.length === 0 && <p className="text-sm text-slate-500">No payroll runs yet.</p>}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-slate-500">Expense claims</h2>
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Employee</th>
                <th className="px-4 py-2 font-medium">Category</th>
                <th className="px-4 py-2 font-medium">Amount</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-2">
                    {e.employee?.firstName} {e.employee?.lastName}
                  </td>
                  <td className="px-4 py-2 text-slate-500">{e.category}</td>
                  <td className="px-4 py-2 text-slate-500">₹{e.amount.toLocaleString()}</td>
                  <td className="px-4 py-2"><StatusBadge status={e.status} /></td>
                  <td className="px-4 py-2 text-right">
                    {e.status === "APPROVED" && (
                      <button onClick={() => markReimbursed(e.id)} className="text-xs font-medium text-indigo-600 hover:underline">
                        Mark reimbursed
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    No expense claims yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-slate-500">Loans</h2>
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Employee</th>
                <th className="px-4 py-2 font-medium">Amount</th>
                <th className="px-4 py-2 font-medium">Remaining</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loans.map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-2">
                    {l.employee?.firstName} {l.employee?.lastName}
                  </td>
                  <td className="px-4 py-2 text-slate-500">₹{l.amount.toLocaleString()}</td>
                  <td className="px-4 py-2 text-slate-500">{l.remainingAmount != null ? `₹${l.remainingAmount.toLocaleString()}` : "—"}</td>
                  <td className="px-4 py-2"><StatusBadge status={l.status} /></td>
                </tr>
              ))}
              {loans.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                    No loan requests yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CompensationForm({ employees }: { employees: Employee[] }) {
  const [employeeId, setEmployeeId] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [annualCTC, setAnnualCTC] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);
    try {
      await apiFetch("/compensation", {
        method: "POST",
        body: JSON.stringify({ employeeId, effectiveFrom, annualCTC: Number(annualCTC) }),
      });
      setSuccess(true);
      setAnnualCTC("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-4">
      <h2 className="col-span-4 text-sm font-medium text-slate-500">Set compensation</h2>
      <select required value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:col-span-2">
        <option value="">Employee…</option>
        {employees.map((emp) => (
          <option key={emp.id} value={emp.id}>
            {emp.firstName} {emp.lastName}
          </option>
        ))}
      </select>
      <input required type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
      <input required type="number" min="1" placeholder="Annual CTC" value={annualCTC} onChange={(e) => setAnnualCTC(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
      {error && <p className="col-span-4 text-sm text-red-600">{error}</p>}
      {success && <p className="col-span-4 text-sm text-green-700">Compensation saved.</p>}
      <button type="submit" disabled={submitting} className="col-span-4 w-fit rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
        {submitting ? "Saving…" : "Save compensation"}
      </button>
    </form>
  );
}

function NewRunForm({ onCreated }: { onCreated: () => void }) {
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiFetch("/payroll", { method: "POST", body: JSON.stringify({ month: Number(month), year: Number(year) }) });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-4">
      <h2 className="col-span-4 text-sm font-medium text-slate-500">Start a payroll run</h2>
      <select value={month} onChange={(e) => setMonth(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
        {MONTH_NAMES.map((m, i) => (
          <option key={m} value={i + 1}>
            {m}
          </option>
        ))}
      </select>
      <input required type="number" value={year} onChange={(e) => setYear(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
      {error && <p className="col-span-4 text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={submitting} className="col-span-4 w-fit rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
        {submitting ? "Creating…" : "Create run"}
      </button>
    </form>
  );
}
