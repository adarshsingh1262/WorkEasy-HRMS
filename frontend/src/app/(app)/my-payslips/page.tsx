"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Payslip } from "@/lib/types";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function MyPayslipsPage() {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Payslip[]>("/payroll/me/payslips")
      .then(setPayslips)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">My Payslips</h1>

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : payslips.length === 0 ? (
        <p className="text-sm text-slate-500">No payslips yet.</p>
      ) : (
        <div className="space-y-3">
          {payslips.map((p) => (
            <div key={p.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="font-medium">
                  {p.payrollRun ? `${MONTH_NAMES[p.payrollRun.month - 1]} ${p.payrollRun.year}` : "—"}
                </p>
                <p className="text-sm font-semibold text-slate-900">₹{p.netPay.toLocaleString()}</p>
              </div>
              <div className="mt-2 grid grid-cols-3 text-xs text-slate-500">
                <span>Gross: ₹{p.grossPay.toLocaleString()}</span>
                <span>Deductions: ₹{p.deductions.toLocaleString()}</span>
                <span>Net: ₹{p.netPay.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
