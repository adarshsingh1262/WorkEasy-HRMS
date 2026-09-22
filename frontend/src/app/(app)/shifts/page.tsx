"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Employee, ShiftAssignment, ShiftTemplate } from "@/lib/types";

export default function ShiftsPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("shift:manage");

  const [myShift, setMyShift] = useState<ShiftAssignment | null>(null);
  const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [mine, tpls] = await Promise.all([
        apiFetch<ShiftAssignment | null>("/shifts/me"),
        apiFetch<ShiftTemplate[]>("/shifts/templates"),
      ]);
      setMyShift(mine);
      setTemplates(tpls);
      if (canManage) {
        const [all, emps] = await Promise.all([
          apiFetch<ShiftAssignment[]>("/shifts"),
          apiFetch<Employee[]>("/employees"),
        ]);
        setAssignments(all);
        setEmployees(emps);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount, re-run once permission is known
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManage]);

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Shifts</h1>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">My shift</p>
        {loading ? (
          <p className="mt-2 text-sm text-slate-500">Loading…</p>
        ) : myShift ? (
          <p className="mt-2 font-medium">
            {myShift.shiftTemplate.name} · {myShift.shiftTemplate.startTime} – {myShift.shiftTemplate.endTime}
          </p>
        ) : (
          <p className="mt-2 text-sm text-slate-500">No shift assigned yet.</p>
        )}
      </div>

      {canManage && (
        <>
          <TemplateForm onCreated={load} />
          <AssignForm templates={templates} employees={employees} onAssigned={load} />

          <div>
            <h2 className="mb-2 text-sm font-medium text-slate-500">All assignments</h2>
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="px-4 py-2 font-medium">Employee</th>
                    <th className="px-4 py-2 font-medium">Shift</th>
                    <th className="px-4 py-2 font-medium">Effective from</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assignments.map((a) => (
                    <tr key={a.id}>
                      <td className="px-4 py-2">
                        {a.employee?.firstName} {a.employee?.lastName}
                      </td>
                      <td className="px-4 py-2 text-slate-500">
                        {a.shiftTemplate.name} ({a.shiftTemplate.startTime}–{a.shiftTemplate.endTime})
                      </td>
                      <td className="px-4 py-2 text-slate-500">{new Date(a.effectiveFrom).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {assignments.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-slate-500">
                        No shift assignments yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function TemplateForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiFetch("/shifts/templates", { method: "POST", body: JSON.stringify({ name, startTime, endTime }) });
      setName("");
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-4">
      <h2 className="col-span-4 text-sm font-medium text-slate-500">New shift template</h2>
      <input required placeholder="Name (e.g. Day Shift)" value={name} onChange={(e) => setName(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />
      <input required type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
      <input required type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
      {error && <p className="col-span-4 text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={submitting} className="col-span-4 w-fit rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50">
        {submitting ? "Creating…" : "Create template"}
      </button>
    </form>
  );
}

function AssignForm({
  templates,
  employees,
  onAssigned,
}: {
  templates: ShiftTemplate[];
  employees: Employee[];
  onAssigned: () => void;
}) {
  const [employeeId, setEmployeeId] = useState("");
  const [shiftTemplateId, setShiftTemplateId] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiFetch("/shifts/assign", {
        method: "POST",
        body: JSON.stringify({ employeeId, shiftTemplateId, effectiveFrom }),
      });
      onAssigned();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-4">
      <h2 className="col-span-4 text-sm font-medium text-slate-500">Assign employee to shift</h2>
      <select required value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
        <option value="">Employee…</option>
        {employees.map((emp) => (
          <option key={emp.id} value={emp.id}>
            {emp.firstName} {emp.lastName}
          </option>
        ))}
      </select>
      <select required value={shiftTemplateId} onChange={(e) => setShiftTemplateId(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
        <option value="">Shift template…</option>
        {templates.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <input required type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
      {error && <p className="col-span-4 text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={submitting} className="col-span-4 w-fit rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50">
        {submitting ? "Assigning…" : "Assign"}
      </button>
    </form>
  );
}
