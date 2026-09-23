"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { Employee, OnboardingTask } from "@/lib/types";

export default function OnboardingPage() {
  const [tasks, setTasks] = useState<OnboardingTask[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [t, e] = await Promise.all([
        apiFetch<OnboardingTask[]>("/onboarding"),
        apiFetch<Employee[]>("/employees"),
      ]);
      setTasks(t);
      setEmployees(e.filter((emp) => emp.status === "ONBOARDING"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load();
  }, []);

  const grouped = tasks.reduce<Record<string, OnboardingTask[]>>((acc, task) => {
    const key = task.employee ? `${task.employee.firstName} ${task.employee.lastName} (${task.employee.employeeCode})` : "Unknown";
    acc[key] = acc[key] ?? [];
    acc[key].push(task);
    return acc;
  }, {});

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Onboarding</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {showForm ? "Cancel" : "Add task"}
        </button>
      </div>

      {showForm && (
        <AddTaskForm
          employees={employees}
          onCreated={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : Object.keys(grouped).length === 0 ? (
        <p className="text-sm text-slate-500">No onboarding tasks yet.</p>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([employeeLabel, employeeTasks]) => (
            <div key={employeeLabel} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="mb-2 font-medium">{employeeLabel}</p>
              <ul className="space-y-1 text-sm">
                {employeeTasks.map((t) => (
                  <li key={t.id} className={t.done ? "text-slate-400 line-through" : "text-slate-700"}>
                    {t.title}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AddTaskForm({ employees, onCreated }: { employees: Employee[]; onCreated: () => void }) {
  const [employeeId, setEmployeeId] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiFetch("/onboarding", { method: "POST", body: JSON.stringify({ employeeId, title }) });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3">
      <select required value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
        <option value="">Employee (onboarding)…</option>
        {employees.map((emp) => (
          <option key={emp.id} value={emp.id}>
            {emp.firstName} {emp.lastName}
          </option>
        ))}
      </select>
      <input required placeholder="Task title" value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:col-span-2" />
      {error && <p className="col-span-3 text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={submitting} className="col-span-3 w-fit rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
        {submitting ? "Adding…" : "Add task"}
      </button>
    </form>
  );
}
