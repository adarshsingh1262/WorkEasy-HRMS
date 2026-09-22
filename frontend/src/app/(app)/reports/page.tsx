"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { AttritionReport, HeadcountReport, LeaveLiabilityReport, PayrollCostReport } from "@/lib/types";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function ReportsPage() {
  const [headcount, setHeadcount] = useState<HeadcountReport | null>(null);
  const [attrition, setAttrition] = useState<AttritionReport | null>(null);
  const [leaveLiability, setLeaveLiability] = useState<LeaveLiabilityReport | null>(null);
  const [payrollCost, setPayrollCost] = useState<PayrollCostReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      apiFetch<HeadcountReport>("/reports/headcount").then(setHeadcount),
      apiFetch<AttritionReport>("/reports/attrition").then(setAttrition),
      apiFetch<LeaveLiabilityReport>("/reports/leave-liability").then(setLeaveLiability),
      apiFetch<PayrollCostReport>("/reports/payroll-cost").then(setPayrollCost),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div className="max-w-4xl space-y-8">
      <h1 className="text-2xl font-semibold">Reports</h1>

      {headcount && (
        <ReportCard title="Headcount">
          <p className="text-3xl font-semibold">{headcount.total}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            {headcount.byStatus.map((s) => (
              <div key={s.status} className="rounded-md bg-slate-50 p-2">
                <p className="text-slate-500">{s.status}</p>
                <p className="font-medium">{s.count}</p>
              </div>
            ))}
          </div>
          {headcount.byDepartment.length > 0 && (
            <div className="mt-3">
              <p className="mb-1 text-xs font-medium text-slate-500">By department</p>
              <div className="space-y-1 text-sm">
                {headcount.byDepartment.map((d) => (
                  <div key={d.department} className="flex justify-between">
                    <span>{d.department}</span>
                    <span className="text-slate-500">{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ReportCard>
      )}

      {attrition && (
        <ReportCard title="Attrition (last 12 months)">
          <p className="text-3xl font-semibold">{attrition.totalExits}</p>
          {attrition.byMonth.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No exits recorded.</p>
          ) : (
            <div className="mt-3 space-y-1 text-sm">
              {attrition.byMonth.map((m) => (
                <div key={m.month} className="flex justify-between">
                  <span>{m.month}</span>
                  <span className="text-slate-500">{m.count}</span>
                </div>
              ))}
            </div>
          )}
        </ReportCard>
      )}

      {leaveLiability && (
        <ReportCard title={`Leave liability (${leaveLiability.year})`}>
          {leaveLiability.byLeaveType.length === 0 ? (
            <p className="text-sm text-slate-500">No leave balances recorded yet.</p>
          ) : (
            <div className="space-y-1 text-sm">
              {leaveLiability.byLeaveType.map((l) => (
                <div key={l.leaveType} className="flex justify-between">
                  <span>{l.leaveType}</span>
                  <span className="text-slate-500">
                    {l.remainingDays} remaining · {l.usedDays} used
                  </span>
                </div>
              ))}
            </div>
          )}
        </ReportCard>
      )}

      {payrollCost && (
        <ReportCard title="Payroll cost">
          {payrollCost.byRun.length === 0 ? (
            <p className="text-sm text-slate-500">No processed payroll runs yet.</p>
          ) : (
            <div className="space-y-1 text-sm">
              {payrollCost.byRun.map((r) => (
                <div key={`${r.month}-${r.year}`} className="flex justify-between">
                  <span>
                    {MONTH_NAMES[r.month - 1]} {r.year} ({r.employeeCount} employees)
                  </span>
                  <span className="text-slate-500">
                    ₹{r.grossTotal.toLocaleString()} gross · ₹{r.netTotal.toLocaleString()} net
                  </span>
                </div>
              ))}
            </div>
          )}
        </ReportCard>
      )}
    </div>
  );
}

function ReportCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-2 text-sm font-medium text-slate-500">{title}</h2>
      {children}
    </section>
  );
}
